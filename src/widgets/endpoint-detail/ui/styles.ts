// Unified styles for all endpoint detail components

export const styles = {
  // Layout
  contentPadding: 'p-4',
  headerPadding: 'px-4 py-2.5',
  sectionSpacing: 'space-y-4',
  inlineGap: 'gap-2',
  
  // Inputs
  input: 'w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] transition-colors',
  select: 'w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]',
  textarea: 'w-full px-3 py-2 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] resize-none',
  
  // Labels
  label: 'text-[12px] font-medium text-gray-700 mb-2 block',
  
  // Cards
  card: 'bg-gray-50 border border-gray-100 rounded p-3',
  
  // Messages
  messageSent: 'bg-blue-50 border-blue-100 ml-auto max-w-[70%]',
  messageReceived: 'bg-green-50 border-green-100 mr-auto max-w-[70%]',
  messageSystem: 'bg-amber-50 border-amber-100 mx-auto max-w-[85%]',
  
  // Status
  statusSuccess: 'text-green-600',
  statusError: 'text-red-600',
  statusWarning: 'text-amber-600',
  statusInfo: 'text-blue-600',
  
  // Buttons (using existing DetailButton component)
  iconSize: 12,
  
  // Response
  responseContainer: 'h-full overflow-auto',
  responseHeader: 'flex items-center justify-between px-4 py-2 border-b border-gray-100',
  
  // Tabs (consistent with EndpointDetailTabs)
  tabContainer: 'flex items-center gap-6 px-4 border-b border-gray-100 bg-white',
  tabButton: 'py-2 text-[12px] font-medium relative transition-colors',
  tabActive: 'text-gray-900',
  tabInactive: 'text-gray-500 hover:text-gray-700',
  
  // Statistics
  statCard: 'p-3 rounded border',
  statLabel: 'text-[11px] uppercase',
  statValue: 'text-[16px] font-semibold mt-1'
}