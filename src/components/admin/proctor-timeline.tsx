import { Eye, Copy, ClipboardPaste, MonitorOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ProctorTimelineProps {
  events: Array<{
    eventType: string;
    createdAt: Date;
    details: unknown;
  }>;
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "tab_switch":
      return <Eye className="h-4 w-4" />;
    case "copy":
      return <Copy className="h-4 w-4" />;
    case "paste":
      return <ClipboardPaste className="h-4 w-4" />;
    case "focus_lost":
      return <MonitorOff className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
}

function getEventLabel(eventType: string): string {
  switch (eventType) {
    case "tab_switch":
      return "Tab Switch";
    case "copy":
      return "Copy";
    case "paste":
      return "Paste";
    case "focus_lost":
      return "Focus Lost";
    default:
      return eventType;
  }
}

function getEventColor(eventType: string): string {
  switch (eventType) {
    case "tab_switch":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "copy":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "paste":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "focus_lost":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function ProctorTimeline({ events }: ProctorTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No proctor events recorded.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 p-3 rounded-lg border ${getEventColor(
            event.eventType
          )}`}
        >
          <div className="flex-shrink-0">{getEventIcon(event.eventType)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">
              {getEventLabel(event.eventType)}
            </div>
            {event.details !== null && event.details !== undefined && (
              <div className="text-xs opacity-75 truncate">
                {typeof event.details === "string"
                  ? event.details
                  : JSON.stringify(event.details)}
              </div>
            )}
          </div>
          <div className="text-xs opacity-75 flex-shrink-0">
            {formatDate(event.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
