"use client"
import aceLogo from "../assets/nutech.jpeg";

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import supabase from "../../SupabaseClient";
import { Home, ClipboardList, CheckSquare, User as UserIcon, LogOut, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"

const UserLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true"
    } catch (e) {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("sidebar_collapsed", String(next))
      } catch (e) {}
      return next
    })
  }
  const [username, setUsername] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileImage, setProfileImage] = useState("")

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('user-name')

    if (!storedUsername) {
      navigate('/login')
      return
    }

    setUsername(storedUsername)
    setIsAdmin(storedUsername.toLowerCase() === 'admin')

    // Initial load from localStorage
    const cachedImage = localStorage.getItem('profile_image');
    setProfileImage(cachedImage || "")

    // Sync with database to get the latest image
    const syncProfileImage = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("profile_image")
          .eq("user_name", storedUsername)
          .single();

        if (data && data.profile_image) {
          setProfileImage(data.profile_image);
          localStorage.setItem("profile_image", data.profile_image);
          console.log("✅ User profile image synced from DB:", data.profile_image);
        }
      } catch (err) {
        console.error("❌ Error syncing user profile image:", err);
      }
    };

    if (storedUsername) {
      syncProfileImage();
    }

    console.log("UserLayout - Profile Image URL (Cached):", cachedImage);
  }, [navigate, username]) // Added username to dependency to ensure it runs when set

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user-name");
    localStorage.removeItem('role')
    localStorage.removeItem('email_id')
    localStorage.removeItem('profile_image')
    navigate('/login')
  }

  const routes = isAdmin
    ? [
      { href: "/admin/dashboard", label: "Dashboard", icon: "home" },
      { href: "/admin/assign-task", label: "Assign Task", icon: "check-square" },
      { href: "/admin/tasks", label: "All Tasks", icon: "clipboard-list" },
    ]
    : [
      { href: "/user/dashboard", label: "Dashboard", icon: "home" },
      { href: "/user/tasks", label: "My Tasks", icon: "clipboard-list" },
      { href: "/user/completed-tasks", label: "Completed Tasks", icon: "check-square" },
      { href: "/user/profile", label: "Profile", icon: "user" },
    ]

  const getIcon = (iconName) => {
    switch (iconName) {
      case "home":
        return <Home className="w-4 h-4" />
      case "clipboard-list":
        return <ClipboardList className="w-4 h-4" />
      case "check-square":
        return <CheckSquare className="w-4 h-4" />
      case "user":
        return <UserIcon className="w-4 h-4" />
      default:
        return <Home className="w-4 h-4" />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF6F0] selection:bg-gold-200 selection:text-leather-950">
      {/* Sidebar for desktop */}
      <aside
        className={`hidden flex-shrink-0 border-r border-leather-200 bg-white md:flex md:flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        {isCollapsed ? (
          <div className="flex h-14 items-center justify-center border-b border-gold-400/20 px-2 bg-gradient-to-r from-leather-800 to-leather-700">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-cream-200 hover:text-white hover:bg-leather-700/80 transition-colors flex items-center justify-center cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex h-14 items-center justify-between border-b border-gold-400/20 px-3.5 bg-gradient-to-r from-leather-800 to-leather-700">
            <Link
              to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
              className="flex items-center gap-2.5 font-bold text-cream-100 min-w-0"
              title="Sapid Design's"
            >
              <img
                src={aceLogo}
                alt="Sapid Design's Logo"
                className="h-8 w-8 rounded-full object-cover border border-gold-400/50 ring-1 ring-gold-400/30 shrink-0"
              />
              <span className="tracking-wide font-serif truncate text-sm">Sapid Design's</span>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-cream-200 hover:text-white hover:bg-leather-700/80 transition-colors shrink-0 cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto thin-scrollbar p-2">
          {isCollapsed ? (
            <ul className="space-y-2">
              {routes.map((route) => (
                <li key={route.href} className="flex justify-center">
                  <Link
                    to={route.href}
                    title={route.label}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${
                      location.pathname === route.href
                        ? "bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 shadow-xs border-l-2 border-gold-400 font-semibold"
                        : "text-leather-700 hover:bg-cream-100 hover:text-leather-950"
                    }`}
                  >
                    <span className={location.pathname === route.href ? "text-gold-300" : "text-leather-600"}>
                      {getIcon(route.icon)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-1">
              {routes.map((route) => (
                <li key={route.href}>
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      location.pathname === route.href
                        ? "bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 shadow-xs border-l-4 border-gold-400 font-semibold"
                        : "text-leather-900 hover:bg-cream-100 hover:text-leather-950"
                    }`}
                  >
                    {getIcon(route.icon)}
                    {route.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* Sidebar Footer */}
        {isCollapsed ? (
          <div className="border-t border-leather-200 p-2 bg-cream-100/60 flex flex-col items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-full bg-gradient-to-br from-leather-700 to-leather-800 flex items-center justify-center overflow-hidden border border-gold-400/40 text-cream-100 shadow-xs"
              title={`${username} (${isAdmin ? 'Admin' : 'Staff Member'})`}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={username}
                  className="h-full w-full object-cover"
                  onError={() => {
                    console.error("❌ UserLayout Image Failed:", profileImage);
                    setProfileImage("");
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-cream-100">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-leather-700 hover:text-red-700 p-1.5 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-t border-leather-200 p-4 bg-cream-100/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-leather-700 to-leather-800 flex items-center justify-center overflow-hidden border border-gold-400/40 text-cream-100 shadow-xs">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={username}
                      className="h-full w-full object-cover"
                      onError={() => {
                        console.error("❌ UserLayout Image Failed:", profileImage);
                        setProfileImage("");
                      }}
                    />
                  ) : (
                    <span className="text-sm font-bold text-cream-100">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-leather-900">
                    {isAdmin ? 'Admin' : 'Staff Member'}
                  </p>
                  <p className="text-xs text-leather-600">
                    {username}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-leather-700 hover:text-leather-950 p-1.5 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-leather-950/60 backdrop-blur-xs md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 ease-in-out md:hidden shadow-2xl flex flex-col`}
      >
        <div className="flex h-14 items-center border-b border-gold-400/20 px-4 bg-gradient-to-r from-leather-800 to-leather-700">
          <Link
            to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
            className="flex items-center gap-2.5 font-bold text-cream-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img src={aceLogo} alt="Sapid Design's Logo" className="h-8 w-8 rounded-full object-cover border border-gold-400/50 ring-1 ring-gold-400/30" />
            <span className="tracking-wide font-serif">Sapid Design's</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto thin-scrollbar p-2 bg-white">
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  to={route.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${location.pathname === route.href
                    ? "bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 shadow-xs border-l-4 border-gold-400 font-semibold"
                    : "text-leather-900 hover:bg-cream-100 hover:text-leather-950"
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {getIcon(route.icon)}
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-leather-200 p-4 bg-cream-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-leather-700 to-leather-800 flex items-center justify-center overflow-hidden border border-gold-400/40 text-cream-100 shadow-xs">
                {profileImage ? (
                  <img src={profileImage} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-cream-100">
                    {username ? username.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-leather-900">
                  {isAdmin ? 'Admin' : 'Staff Member'}
                </p>
                <p className="text-xs text-leather-600">
                  {username}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-leather-700 hover:text-leather-950 p-1.5 rounded-lg hover:bg-cream-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#FAF6F0]">
        <header className="flex h-14 items-center justify-between border-b border-leather-200 bg-white px-4 md:px-6 shadow-xs">
          <button
            className="md:hidden text-leather-800 p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </button>
          <h1 className="text-lg font-bold text-leather-900 font-serif">
            {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 bg-[#FAF6F0]">
          {children}
        </main>

        <div className="bg-gradient-to-r from-leather-950 via-leather-900 to-leather-950 h-5 flex items-center justify-center px-4 shadow-md z-40 border-t border-gold-500/30">
          <a
            href="https://www.botivate.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cream-200 font-medium tracking-[0.2em] uppercase hover:underline hover:text-gold-300 transition-colors"
          >
            Powered by <span className="font-bold text-gold-400">Botivate</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default UserLayout