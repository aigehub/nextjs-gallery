const navItems = {
    0: [ { text: "首页", link: "homePage.html" }, { text: "登录", link: "userlogin.html" }, { text: "EXIT", link: "#" } ],
    1: [ { text: "首页", link: "homePage.html" }, { text: "用户管理", link: "userManage.html" }, { text: "视频审核", link: "videoStateManage.html" }, { text: "编号/工作", link: "codeJobManage.html" }, { text: "TOP", link: "topManage.html" }, { text: "IPBAN", link: "ipBanManage.html" }, { text: "修改密码", link: "editPassword.html" }, { text: "EXIT", link: "#" } ],
    2: [ { text: "首页", link: "homePage.html" }, { text: "相册管理", link: "picManage.html" }, { text: "金币记录", link: "rmbLog.html" }, { text: "浏览统计", link: "browseLog.html" }, { text: "修改密码", link: "editPassword.html" }, { text: "EXIT", link: "#" } ],
    3: [ { text: "首页", link: "homePage.html" }, { text: "发单设置", link: "createGuest.html" }, { text: "拉黑管理", link: "blockManage.html" }, { text: "金币记录", link: "rmbLog.html" }, { text: "修改密码", link: "editPassword.html" }, { text: "EXIT", link: "#" } ],
	4: [ { text: "首页", link: "homePage.html" }, { text: "EXIT", link: "#" } ]
};
document.addEventListener('DOMContentLoaded', async () => {
	const user = await fetchUser();
    initMenu(user); 
});
async function fetchUser() {
	const defaultUser = { role: 0, username: 'guest' };
	try {
		const response = await fetch(`${window.API_URL}/api/auth/user`, {
			method: 'GET',
			credentials: 'include'
		});
        const safeUser =  await response.json();
		if (response.ok) {
			const user = safeUser || defaultUser;
			sessionStorage.setItem('user', JSON.stringify(user));
			return user;
		} else {
			sessionStorage.setItem('user', JSON.stringify(defaultUser));
			return defaultUser;
		}	
	} catch (error) {
		console.error('获取数据错误:', error);
		throw error;		
	}
}
function initMenu(user) {
	displayUsername(user.role === 4 ? 'guest' : user.username);
    generateNavMenu(user.role);
    const menuIcon = document.querySelector('.menu-icon');
    const sideMenu = document.getElementById('sideMenu');
    if (!menuIcon || !sideMenu) return;
    menuIcon.addEventListener('click', (event) => {
        sideMenu.style.display = sideMenu.style.display === 'block' ? 'none' : 'block';
        event.stopPropagation();
    });
    document.addEventListener('click', (event) => {
		if (sideMenu.style.display === 'block' && !sideMenu.contains(event.target) && event.target !== menuIcon) {
            sideMenu.style.display = 'none';
        }
    });
    sideMenu.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}
function displayUsername(username) {
    const menuContainer = document.querySelector('.side-menu ul');
    if (!menuContainer) return;
    const userDiv = document.createElement('div');
    userDiv.style.fontWeight = 'bold'; 
    userDiv.style.marginBottom = '10px';
    userDiv.textContent = username || 'guest'; 
    menuContainer.parentElement.insertBefore(userDiv, menuContainer);
}
function generateNavMenu(role) {
    const menuItems = navItems[role] || navItems[0]; 
    renderMenu(menuItems);
}
function renderMenu(menuItems) {
    const menuContainer = document.querySelector('.side-menu ul');
    if (!menuContainer) return; 
    const fragment = document.createDocumentFragment(); 
	menuItems.forEach(item => {
        const li = document.createElement('li');
        const link = document.createElement('a'); 
        link.href = item.link;
        link.textContent = item.text; 
        if (item.text === 'EXIT') {
            link.addEventListener('click', (event) => {
                event.preventDefault(); 
                logout();
            });
        } else {		 
			link.addEventListener('click', (event) => {
				event.preventDefault();
				setTimeout(() => {
					location.assign(item.link);
				}, 50);
			});
		}
        li.appendChild(link); 
        fragment.appendChild(li);
    });
	menuContainer.innerHTML = ''; 
    menuContainer.appendChild(fragment);
}
async function logout() {
    try {
        window.isLoggingOut = true;
        const response = await fetch(`${window.API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('EXIT错误:', error);
    } finally {    
        localStorage.clear();
        sessionStorage.clear();
		document.cookie = 'provinceCode=; Max-Age=0; path=/';
        location.replace('index.html');
        window.isLoggingOut = false;
    }
}