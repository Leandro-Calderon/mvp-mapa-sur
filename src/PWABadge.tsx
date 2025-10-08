import "./PWABadge.css";

function PWABadge() {
  return (
    <div className="PWABadge" role="alert" aria-live="assertive" aria-labelledby="toast-message">
      {/* PWA functionality is handled automatically by Vite PWA */}
    </div>
  );
}

export default PWABadge;
