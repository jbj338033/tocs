"use client"

import { useState, useEffect } from "react"

import { Project, ProjectMember, MemberRole } from "@/entities/project"

import { Button, Card, Input, Badge, Select } from "@/shared/ui/components"
import { User, Plus, Settings } from "@/shared/ui/icons"

interface ProjectMembersDialogProps {
  project: Project
  onClose: () => void
}

const roleOptions = [
  { value: MemberRole.OWNER, label: "Owner" },
  { value: MemberRole.EDITOR, label: "Editor" },
  { value: MemberRole.VIEWER, label: "Viewer" }
]

const roleColors = {
  [MemberRole.OWNER]: "bg-purple-100 text-purple-800",
  [MemberRole.EDITOR]: "bg-blue-100 text-blue-800",
  [MemberRole.VIEWER]: "bg-gray-100 text-gray-800"
}

export function ProjectMembersDialog({ project, onClose }: ProjectMembersDialogProps) {
  const [members, setMembers] = useState<ProjectMember[]>(project.members || [])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.VIEWER)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string>()

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setError("Please enter an email address")
      return
    }

    if (!inviteEmail.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setIsInviting(true)
      setError(undefined)

      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to invite member")
      }

      const newMember = await response.json()
      setMembers(prev => [...prev, newMember])
      setInviteEmail("")
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        throw new Error("Failed to update member role")
      }

      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member role")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      setMembers(prev => prev.filter(member => member.id !== memberId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Project Members
            </h2>
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage who can access {project.name}
          </p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Invite Member</h3>
            
            <div className="space-y-3">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                type="email"
              />
              
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as MemberRole)}
                options={roleOptions}
              />
              
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
                className="w-full"
              >
                <Plus size={14} className="mr-2" />
                {isInviting ? "Inviting..." : "Send Invitation"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Current Members ({members.length})
            </h3>
            
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {member.user.image ? (
                        <img 
                          src={member.user.image} 
                          alt={member.user.name || "User"} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User size={16} className="text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${roleColors[member.role]}`}>
                      {member.role}
                    </Badge>
                    
                    {member.role !== MemberRole.OWNER && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const newRole = member.role === MemberRole.EDITOR ? MemberRole.VIEWER : MemberRole.EDITOR
                            handleRoleChange(member.id, newRole)
                          }}
                        >
                          <Settings size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {members.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No members yet
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}