"use client";

import { useEndpointStore } from "@/shared/stores";

interface EndpointItemProps {
  endpoint: any;
  level: number;
}

export function EndpointItem({ endpoint, level }: EndpointItemProps) {
  const { selectedEndpointId, setSelectedEndpoint } = useEndpointStore();

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-700";
      case "POST":
        return "bg-blue-100 text-blue-700";
      case "PUT":
        return "bg-yellow-100 text-yellow-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      case "PATCH":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getProtocolIcon = (type: string) => {
    switch (type) {
      case "GRAPHQL":
        return "GQL";
      case "WEBSOCKET":
        return "WS";
      case "SOCKETIO":
        return "IO";
      case "GRPC":
        return "gRPC";
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => setSelectedEndpoint(endpoint)}
      className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded ${
        selectedEndpointId === endpoint.id ? "bg-blue-50" : ""
      }`}
      style={{ paddingLeft: `${level * 16 + 24}px` }}
    >
      {endpoint.type === "HTTP" && endpoint.method && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getMethodColor(endpoint.method)}`}>
          {endpoint.method}
        </span>
      )}
      {endpoint.type !== "HTTP" && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
          {getProtocolIcon(endpoint.type)}
        </span>
      )}
      <span className="text-sm text-gray-700 flex-1 truncate">{endpoint.name}</span>
    </div>
  );
}