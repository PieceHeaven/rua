// 做全局路由
import router from "./router/router";
import store from "./store";
import { getToken } from "@/utils/auth"; // 从cookie获取令牌
const whiteList = ["/login"];

router.beforeEach(async (to, from, next) => {
    const hasToken = getToken();
    if (hasToken) {
        if (to.path === "/login") {
            next({ path: "/main/categoryList" });
        }
        else {
            const hasRoles = store.getters.roles && store.getters.roles.length > 0;
            if (hasRoles) {
                next();
            } else {
                try {
                    // 先请求获取用户信息
                    const { roles } = await store.dispatch("user/getInfo");
                    // 根据当前用户角色动态生成路由
                    const accessRoutes = await store.dispatch(
                        "permission/generateRoutes",
                        roles
                    );
                    // alert(error || "出错了");
                    // // 添加这些路由至路由器
                    router.addRoutes(accessRoutes);
                    // // 继续路由切换，确保addRoutes完成
                    //存在token但是...to中没有值时，定向到分类列表页
                    if (to.path === "/") {
                        next({ path: "/main/categoryList" });
                    }else{
                        next({ ...to, replace: true });
                    }
                } catch (error) {
                    // 出错需重置令牌并重新登录（令牌过期、网络错误等原因）
                    await store.dispatch("user/resetToken");
                    next(`/login?redirect=${to.path}`);
                }
            }
        }
    } else {
        if (whiteList.indexOf(to.path) !== -1) {
            next();
        } else {
            next(`/login?redirect=${to.path}`);
        }
    }
});
