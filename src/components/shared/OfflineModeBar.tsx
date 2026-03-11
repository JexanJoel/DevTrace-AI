import { WifiOff, CloudOff, HardDrive } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

const OfflineModeBar = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="w-full bg-gray-900 dark:bg-gray-950 border-b border-orange-500/30 px-4 sm:px-6 py-2.5 flex items-center gap-6 flex-wrap">

      {/* Left label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-orange-400 font-semibold text-xs tracking-wide uppercase">
          Offline Mode Active
        </span>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-4 bg-gray-700 flex-shrink-0" />

      {/* Status pills */}
      <div className="flex items-center gap-3 flex-wrap">

        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <CloudOff size={11} />
          Cloud AI Unavailable
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <HardDrive size={11} />
          Local history &amp; saved fixes still available
        </div>

        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <WifiOff size={11} />
          Changes will sync on reconnect
        </div>

      </div>
    </div>
  );
};

export default OfflineModeBar;