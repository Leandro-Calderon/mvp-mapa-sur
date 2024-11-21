// import "./PWABadge.css";
// import { useRegisterSW } from "virtual:pwa-register/react";


// function PWABadge() {
//   // periodic sync is disabled, change the value to enable it, the period is in milliseconds
//   // You can remove onRegisteredSW callback and registerPeriodicSync function
//   const period = 0;

//   const {
//     needRefresh: [needRefresh, setNeedRefresh],
//     updateServiceWorker,
//   } = useRegisterSW({
//     onRegisteredSW(swUrl, r) {
//       if (period <= 0) return;
//       if (r?.active?.state === "activated") {
//         registerPeriodicSync(period, swUrl, r);
//       } else if (r?.installing) {
//         r.installing.addEventListener("statechange", (e) => {
//           /** @type {ServiceWorker} */
//           const sw = e.target;
//           if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
//         });
//       }
//     },
//   });

//   function close() {
//     setNeedRefresh(false);
//   }

//   return (
//     <div className="PWABadge" role="alert" aria-labelledby="toast-message">
//       {needRefresh && (
//         <div className="PWABadge-toast">
//           <div className="PWABadge-message">
//             <span id="toast-message">
//               New content available, click on reload button to update.
//             </span>
//           </div>
//           <div className="PWABadge-buttons">
//             <button
//               className="PWABadge-toast-button"
//               onClick={() => updateServiceWorker(true)}
//             >
//               Reload
//             </button>
//             <button className="PWABadge-toast-button" onClick={() => close()}>
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default PWABadge;

// /**
//  * This function will register a periodic sync check every hour, you can modify the interval as needed.
//  * @param period {number}
//  * @param swUrl {string}
//  * @param r {ServiceWorkerRegistration}
//  */
// function registerPeriodicSync(period, swUrl, r) {
//   if (period <= 0) return;

//   setInterval(async () => {
//     if ("onLine" in navigator && !navigator.onLine) return;

//     const resp = await fetch(swUrl, {
//       cache: "no-store",
//       headers: {
//         cache: "no-store",
//         "cache-control": "no-cache",
//       },
//     });

//     if (resp?.status === 200) await r.update();
//   }, period);
// }
// import './PWABadge.css'
// import { useRegisterSW } from 'virtual:pwa-register/react'
// import { useState } from 'react'

// function PWABadge({ title = 'New content available', reloadButtonText = 'Reload', closeButtonText = 'Close', position = 'bottom-right', color = '#333', backgroundColor = '#fff', ...props }) {
//   const [needRefresh, setNeedRefresh] = useState(false)

//   const {
//     updateServiceWorker,
//   } = useRegisterSW({
//     onRegisteredSW(swUrl, registration) {
//       if (registration?.active?.state === 'activated') {
//         registerPeriodicSync(3600000, swUrl, registration) // 1 hour
//       } else if (registration?.installing) {
//         registration.installing.addEventListener('statechange', (e) => {
//           const sw = e.target
//           if (sw.state === 'activated')
//             registerPeriodicSync(3600000, swUrl, registration)
//         })
//       }
//       setNeedRefresh(true)
//     },
//   })

//   function close() {
//     setNeedRefresh(false)
//   }

//   function handleReload() {
//     updateServiceWorker(true)
//   }

//   return (
//     <div className={`PWABadge PWABadge--${position}`} role="alert" aria-labelledby="toast-message" style={{ color, backgroundColor, ...props }}>
//       {needRefresh && (
//         <div className="PWABadge-toast">
//           <div className="PWABadge-message">
//             <span id="toast-message">{title}</span>
//           </div>
//           <div className="PWABadge-buttons">
//             <button className="PWABadge-toast-button" onClick={handleReload}>{reloadButtonText}</button>
//             <button className="PWABadge-toast-button" onClick={close}>{closeButtonText}</button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default PWABadge

// /**
//  * This function will register a periodic sync check every hour, you can modify the interval as needed.
//  * @param period {number}
//  * @param swUrl {string}
//  * @param registration {ServiceWorkerRegistration}
//  */
// function registerPeriodicSync(period, swUrl, registration) {
//   if (period <= 0) return

//   setInterval(async () => {
//     if ('onLine' in navigator && !navigator.onLine)
//       return

//     const resp = await fetch(swUrl, {
//       cache: 'no-store',
//       headers: {
//         'cache': 'no-store',
//         'cache-control': 'no-cache',
//       },
//     })

//     if (resp?.status === 200)
//       await registration.update()
//   }, period)
// }
import "./PWABadge.css";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";

function PWABadge() {
  const period = 0;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period > 0 && r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  useEffect(() => {
    const handleOnline = () => {
      // Lógica para cuando la aplicación vuelve a estar online
    };
    const handleOffline = () => {
      // Lógica para cuando la aplicación está offline
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function close() {
    setNeedRefresh(false);
  }

  return (
    <div className="PWABadge" role="alert" aria-live="assertive" aria-labelledby="toast-message">
      {needRefresh && (
        <div className="PWABadge-toast">
          <div className="PWABadge-message">
            <span id="toast-message">
              New content available, click on reload button to update.
            </span>
          </div>
          <div className="PWABadge-buttons">
            <button
              className="PWABadge-toast-button"
              onClick={() => updateServiceWorker(true)}
            >
              Reload
            </button>
            <button className="PWABadge-toast-button" onClick={() => close()}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWABadge;

function registerPeriodicSync(period, swUrl, r) {
  if (period <= 0) return;

  setInterval(async () => {
    if (!navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}
