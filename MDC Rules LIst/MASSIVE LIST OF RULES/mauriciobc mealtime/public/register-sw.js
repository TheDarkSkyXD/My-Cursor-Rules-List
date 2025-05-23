if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(registration) {
        console.log('Service worker successfully registered with scope:', registration.scope);
      })
      .catch(function(error) {
 console.log('Service worker successfully registered with scope:', registration.scope);
      });
  });
} 