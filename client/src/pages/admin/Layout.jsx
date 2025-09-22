import { Outlet } from "react-router-dom";
import { AdminNavBar } from "../../components/admin/AdminNavBar";
import { AdminSideBar } from "../../components/admin/AdminSidebar";

export function Layout(){

    return(
        <>
        <AdminNavBar />

        <div className="flex">
            <AdminSideBar />
            <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto">
                <Outlet />
            </div>
        </div>
        </>
    )
}