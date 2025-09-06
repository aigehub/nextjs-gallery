(function () {
	const LOGIN_PAGE = window.location.origin;
	let sessionExpired = false;
    function handleSessionExpired() {
        if (!sessionExpired) {
            sessionExpired = true;
            alert('⏳登录已过期,请重新输入原网址访问...');
            sessionStorage.clear();
            window.location.replace(LOGIN_PAGE);
        }
    }   
    (function () {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            return originalFetch(...args).then(response => {
                if (!window.isLoggingOut && response.status === 401) {
                    handleSessionExpired();
                }
                return response;
            });
        };
    })();
    (function () {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (...args) {
            this.addEventListener('load', function () {
                if (!window.isLoggingOut && this.status === 401) {
                    handleSessionExpired();
                }
            });
            originalOpen.apply(this, args);
        };
    })();
})();