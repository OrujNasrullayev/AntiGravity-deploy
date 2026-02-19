/**
 * Authentication management for Oruj's English Portal
 */

const Auth = {
    // Roles: 'student', 'teacher'

    login: async function (email, password, role) {
        // Ensure data is loaded before attempting login
        await DataLoader.waitForData();

        let users = [];
        if (role === 'student') {
            users = typeof NOTION_STUDENTS !== 'undefined' ? NOTION_STUDENTS : [];
        } else if (role === 'teacher') {
            users = typeof NOTION_TEACHERS !== 'undefined' ? NOTION_TEACHERS : [];
        }

        const user = users.find(u =>
            u.email && u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );

        if (user) {
            const sessionsData = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: role
                },
                loginTime: new Date().getTime()
            };
            localStorage.setItem('portal_session', JSON.stringify(sessionsData));
            return { success: true, user: user };
        }

        return { success: false, message: 'Invalid email or password' };
    },

    logout: function () {
        localStorage.removeItem('portal_session');
        window.location.href = 'portal.html';
    },

    getCurrentUser: function () {
        const session = localStorage.getItem('portal_session');
        if (!session) return null;
        try {
            const data = JSON.parse(session);
            // Optional: check session expiry (e.g., 24h)
            const now = new Date().getTime();
            if (now - data.loginTime > 24 * 60 * 60 * 1000) {
                this.logout();
                return null;
            }
            return data.user;
        } catch (e) {
            return null;
        }
    },

    checkAuth: function (requiredRole) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = requiredRole === 'teacher' ? 'teacher-login.html' : 'login.html';
            return null;
        }
        if (user.role !== requiredRole) {
            window.location.href = 'portal.html';
            return null;
        }
        return user;
    },

    redirectIfLoggedIn: function () {
        const user = this.getCurrentUser();
        if (user) {
            if (user.role === 'teacher') {
                window.location.href = 'teacher-calendar.html';
            } else if (user.role === 'student') {
                window.location.href = 'homework.html';
            }
        }
    },

    filterData: function (dataArray, type = 'lessons') {
        const user = this.getCurrentUser();
        if (!user) return [];

        // If dataArray is not provided, try to get it from Global Notion Data
        if (!dataArray || dataArray.length === 0) {
            if (type === 'lessons') dataArray = window.NOTION_LESSONS || [];
            if (type === 'groups') dataArray = window.NOTION_GROUPS || [];
            if (type === 'submissions') dataArray = window.NOTION_SUBMISSIONS || [];
            if (type === 'feedback' || type === 'feedbacks') dataArray = window.NOTION_FEEDBACKS || [];
        }

        if (type === 'lessons') {
            if (user.role === 'teacher') {
                return dataArray.filter(lesson => lesson.teacherId === user.id);
            }
            return dataArray.filter(lesson =>
                lesson.students && lesson.students.some(s => s.id === user.id)
            );
        }

        if (type === 'groups') {
            if (user.role === 'teacher') {
                // Groups logic: Filter by groups that have lessons belonging to this teacher
                // Since groups don't have a direct teacher relation in the exported data yet, 
                // we might need more logic or just return all for now if privacy is less critical for groups,
                // but let's try to be thorough.
                return dataArray;
            }
            return dataArray.filter(group =>
                group.students && group.students.some(s => s.id === user.id)
            );
        }

        if (type === 'submissions') {
            if (user.role === 'teacher') return dataArray;
            return dataArray.filter(sub => sub.studentId === user.id);
        }

        if (type === 'feedback' || type === 'feedbacks') {
            if (user.role === 'teacher') return dataArray;
            return dataArray.filter(fb => fb.studentId === user.id);
        }

        return dataArray;
    }
};

// Auto-init profile if on a dashboard
document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getCurrentUser();
    if (user) {
        // Use standard IDs which are present in both teacher and student templates
        const profileName = document.getElementById('sidebar-name');
        const profileImg = document.getElementById('sidebar-avatar');
        const profileSub = document.getElementById('sidebar-role');

        if (profileName) profileName.textContent = user.name;
        if (profileImg) profileImg.src = user.avatar;
        if (profileSub) {
            profileSub.textContent = user.role === 'teacher' ? 'Instructor' : 'Student';
        }
    }
});
