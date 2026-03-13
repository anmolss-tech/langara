import { showModal } from './modal.js';

let offlineModalInstance = null;

function handleOffline() {
    if (offlineModalInstance) {
        return;
    }
    
    console.log("Network connection lost. Showing offline modal.");
    offlineModalInstance = showModal(
        `Connection Lost!`,
        "You can continue to browse, although some actions may not be available until you reconnect.",
        {
            iconType: 'warning',
            confirmText: 'OK' 
        }
    );
}


function handleOnline() {
    if (offlineModalInstance) {
        console.log("Network connection restored. Closing offline modal.");
        offlineModalInstance.remove();
        offlineModalInstance = null;
        
        setTimeout(() => {
            showModal(
                "Connection Restored", 
                "You are back online!", 
                { 
                    confirmText: 'Great!', 
                    onConfirm: () => {
                        window.location.reload();
                    }
                }
            );
        }, 500);
    }
}

export function initializeNetworkStatusListener() {
    // Add the event listeners to the window object.
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (!navigator.onLine) {
        handleOffline();
    }
    
    console.log("✅ Network status listener initialized.");
}