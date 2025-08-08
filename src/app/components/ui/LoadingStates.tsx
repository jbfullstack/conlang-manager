'use client';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface LoadingOverlayProps {
  message?: string;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    gradient?: string;
  };
  variant?: 'default' | 'search';
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'blue' | 'red' | 'orange';
}

const spinnerColors = {
  blue: 'border-blue-500',
  green: 'border-green-500',
  purple: 'border-purple-500',
  orange: 'border-orange-500',
  red: 'border-red-500',
};

const backgroundGradients = {
  blue: 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50',
  green: 'bg-gradient-to-br from-slate-50 via-green-50 to-blue-50',
  purple: 'bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50',
  orange: 'bg-gradient-to-br from-slate-50 via-orange-50 to-yellow-50',
  red: 'bg-gradient-to-br from-slate-50 via-red-50 to-orange-50',
};

// Loading Screen (fullscreen)
export function LoadingScreen({
  message = 'Chargement...',
  subMessage,
  variant = 'blue',
}: LoadingScreenProps) {
  return (
    <div
      className={`min-h-screen ${backgroundGradients[variant]} flex items-center justify-center`}
    >
      <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
        <div
          className={`animate-spin h-12 w-12 border-3 ${spinnerColors[variant]} border-t-transparent rounded-full mx-auto mb-6`}
        ></div>
        <p className="text-gray-600 text-lg font-medium">{message}</p>
        {subMessage && <div className="mt-4 text-sm text-gray-500">{subMessage}</div>}
      </div>
    </div>
  );
}

// Loading Overlay (pour grilles existantes)
export function LoadingOverlay({ message = 'Actualisation...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl sm:rounded-2xl">
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30">
        <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="text-gray-600 font-medium">{message}</div>
      </div>
    </div>
  );
}

// Empty State
export function EmptyState({
  icon,
  title,
  description,
  actionButton,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-8 sm:p-12 text-center">
      <div className="text-gray-400 text-6xl sm:text-8xl mb-6 animate-float">{icon}</div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className={`${
            actionButton.gradient || 'bg-gradient-to-r from-green-500 to-blue-500'
          } text-white px-6 py-3 rounded-xl font-medium hover:shadow-xl transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto`}
        >
          <span>✨</span>
          <span>{actionButton.label}</span>
        </button>
      )}
    </div>
  );
}

// Error State
export function ErrorState({
  title = 'Oups ! Une erreur est survenue',
  message,
  onRetry,
  variant = 'red',
}: ErrorStateProps) {
  return (
    <div
      className={`min-h-screen ${backgroundGradients[variant]} flex items-center justify-center`}
    >
      <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-red-200">
        <div className="text-red-500 text-6xl mb-6 animate-bounce">⚠️</div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
          {title}
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
          >
            <span>🔄</span>
            <span>Réessayer</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Content Container (pour grilles avec loading overlay)
export function ContentContainer({
  children,
  loading = false,
  loadingMessage,
}: {
  children: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
}) {
  return (
    <div className="relative">
      {loading && <LoadingOverlay message={loadingMessage} />}
      {children}
    </div>
  );
}
