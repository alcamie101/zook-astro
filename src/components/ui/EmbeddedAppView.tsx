import React from 'react';
import { ExternalLink, ArrowLeft, RefreshCw } from 'lucide-react';

interface EmbeddedAppViewProps {
  title: string;
  badge: string;
  description: string;
  src: string;
  onBackToSimulator: () => void;
}

export const EmbeddedAppView: React.FC<EmbeddedAppViewProps> = ({
  title,
  badge,
  description,
  src,
  onBackToSimulator,
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = src;
    }
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden glass-hud border border-slate-800 shadow-2xl relative select-none">
      {/* App Toolbar Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/95 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSimulator}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition text-[11px]"
            title="Return to 3D Sector Simulator"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>3D Simulator</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-700 mx-1" />
          <span className="font-bold text-white text-[12px]">{title}</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
            {badge}
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            &bull; {description}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReload}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Reload App"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 flex items-center gap-1 transition text-[10.5px]"
            title="Open in Fullscreen / New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </a>
        </div>
      </div>

      {/* Embedded Web Viewport */}
      <div className="flex-1 w-full h-full relative bg-[#080a0f]">
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          className="w-full h-full border-0 absolute inset-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    </div>
  );
};
