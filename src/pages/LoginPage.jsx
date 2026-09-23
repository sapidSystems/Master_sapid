"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { loginUser } from "../redux/slice/loginSlice"
import { LoginCredentialsApi } from "../redux/api/loginApi"
import { useMagicToast } from "../context/MagicToastContext"
import supabase from "../SupabaseClient"
import { sendPasswordResetOTP } from "../services/whatsappService"
import { KeyRound, ShieldCheck, User as UserIcon, ArrowLeft, RefreshCw, Smartphone, Eye, EyeOff } from "lucide-react"
import sapidLogo from "../assets/sapidLogo.png"

const LoginPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, userData, error } = useSelector((state) => state.login);
  const dispatch = useDispatch();
  const { showToast } = useMagicToast();

  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState('username') // 'username', 'otp', 'reset'
  const [forgotData, setForgotData] = useState({
    username: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    generatedOtp: ""
  })
  const [isForgotLoading, setIsForgotLoading] = useState(false)

  // Change Password State
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [changeData, setChangeData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isChangeLoading, setIsChangeLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    dispatch(loginUser(formData));
  };

  useEffect(() => {
    const handleLoginSuccess = async () => {
      if (isLoggedIn && userData) {
        console.log("User Data received:", userData); // Debug log

        let designation = userData.Designation || userData.designation || "";

        // If designation is missing, try fetching it explicitly
        if (!designation && userData.user_name) {
          try {
            const { data } = await supabase
              .from('users')
              .select('Designation')
              .eq('user_name', userData.user_name || userData.username)
              .single();
            if (data) {
              designation = data.Designation || "";
            }
          } catch (err) {
            console.error("Error fetching designation:", err);
          }
        }

        localStorage.setItem('user-name', userData.user_name || userData.username || "");
        localStorage.setItem('user-id', userData.id || "");
        localStorage.setItem('role', userData.role || "");
        localStorage.setItem('email_id', userData.email_id || userData.email || "");
        localStorage.setItem('user_access', userData.user_access || "");
        localStorage.setItem('profile_image', userData.profile_image || "");
        localStorage.setItem('can_self_assign', userData.can_self_assign === true ? "true" : "false");
        localStorage.setItem('designation', designation);
        localStorage.setItem('page_access', userData.page_access || "{}");

        console.log("Stored email:", userData.email_id || userData.email); // Debug log

        showToast(`Welcome back, ${userData.user_name || userData.username}!`, "success");
        navigate("/dashboard");
      } else if (error) {
        showToast(error, "error");
        setIsLoginLoading(false);
      }
    };

    handleLoginSuccess();
  }, [isLoggedIn, userData, error, navigate, showToast]);




  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 p-4 selection:bg-gold-200 selection:text-leather-950 relative">
      <div className="w-full max-w-md shadow-2xl border border-leather-200 rounded-3xl bg-white overflow-hidden">
        {/* Header with Sapid Design's Logo & Brand Title */}
        <div className="p-6 bg-gradient-to-r from-leather-800 via-leather-700 to-leather-800 text-center border-b border-gold-400/30 relative">
          <div className="flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-white/95 p-2 shadow-md border border-gold-300/40 flex items-center justify-center mb-3">
              <img
                src={sapidLogo}
                alt="Sapid Design's Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-cream-100 tracking-wide font-serif">Sapid Design's</h2>
            <p className="text-[10px] font-semibold text-gold-300 uppercase tracking-[0.25em] mt-1">Luxury Leather Goods</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="flex items-center text-xs font-bold text-leather-800 uppercase tracking-wider">
              <UserIcon className="h-3.5 w-3.5 mr-1.5 text-gold-600" />
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-leather-200 bg-cream-50/50 rounded-xl text-leather-900 placeholder:text-leather-400/70 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="flex items-center text-xs font-bold text-leather-800 uppercase tracking-wider">
              <KeyRound className="h-3.5 w-3.5 mr-1.5 text-gold-600" />
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-3.5 pr-10 py-2.5 border border-leather-200 bg-cream-50/50 rounded-xl text-leather-900 placeholder:text-leather-400/70 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-leather-400 hover:text-leather-700 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-cream-50/80 p-5 -mx-6 -mb-6 mt-6 rounded-b-3xl border-t border-leather-200 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 rounded-xl font-bold hover:from-leather-900 hover:to-leather-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 border border-gold-500/40 cursor-pointer text-sm tracking-wide uppercase"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Logging in..." : "Sign In"}
            </button>
            <div className="flex justify-between items-center px-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-bold text-leather-700 hover:text-leather-950 transition-colors"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setShowChangeModal(true)}
                className="text-xs font-bold text-gold-700 hover:text-leather-900 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-leather-950/60 backdrop-blur-xs animate-in fade-in duration-300" onClick={() => !isForgotLoading && setShowForgotModal(false)}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-leather-200">
              <div className="bg-gradient-to-br from-cream-100 to-white px-6 py-6 text-center border-b border-leather-100">
                <div className="mx-auto w-16 h-16 bg-cream-100 border border-gold-400/40 rounded-full flex items-center justify-center mb-4 shadow-xs">
                  {forgotStep === 'username' && <UserIcon className="text-leather-800" size={30} />}
                  {forgotStep === 'otp' && <ShieldCheck className="text-leather-800" size={30} />}
                  {forgotStep === 'reset' && <KeyRound className="text-leather-800" size={30} />}
                </div>
                <h3 className="text-xl font-black text-leather-900 leading-tight font-serif">
                  {forgotStep === 'username' && "Find Your Account"}
                  {forgotStep === 'otp' && "Verify Identity"}
                  {forgotStep === 'reset' && "Set New Password"}
                </h3>
              </div>

              <div className="px-6 pb-8 space-y-4 pt-4">
                {forgotStep === 'username' && (
                  <div className="space-y-4">
                    <p className="text-xs text-leather-600 text-center px-2">Enter your username. An OTP will be sent to the Admin for verification.</p>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Username"
                        value={forgotData.username}
                        onChange={(e) => setForgotData({ ...forgotData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                      />
                      <UserIcon className="absolute left-3 top-3.5 text-leather-400" size={18} />
                    </div>
                    <button
                      onClick={async () => {
                        if (!forgotData.username) return showToast("Please enter username", "error");
                        setIsForgotLoading(true);
                        try {
                          const { data, error } = await supabase.from('users').select('user_name').eq('user_name', forgotData.username).single();
                          if (error || !data) return showToast("User not found", "error");

                          const otp = Math.floor(100000 + Math.random() * 900000).toString();
                          await sendPasswordResetOTP(forgotData.username, otp);
                          setForgotData({ ...forgotData, generatedOtp: otp });
                          setForgotStep('otp');
                          showToast("OTP sent to Admin", "success");
                        } catch (err) {
                          showToast("Error processing request", "error");
                        } finally {
                          setIsForgotLoading(false);
                        }
                      }}
                      disabled={isForgotLoading}
                      className="w-full py-3 bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 rounded-xl font-bold hover:from-leather-900 hover:to-leather-800 border border-gold-500/40 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isForgotLoading ? <RefreshCw className="animate-spin" size={18} /> : "Send OTP"}
                    </button>
                    <button onClick={() => setShowForgotModal(false)} className="w-full py-2 text-xs font-bold text-leather-500 hover:text-leather-800 transition-colors">Cancel</button>
                  </div>
                )}

                {forgotStep === 'otp' && (
                  <div className="space-y-4">
                    <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 flex gap-2">
                      <Smartphone className="text-gold-700 flex-shrink-0" size={16} />
                      <p className="text-[10px] text-leather-800 font-medium">OTP has been sent to the admin number. Please contact them for the code.</p>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={forgotData.otp}
                        onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-center tracking-[0.5em] font-black text-leather-900"
                        maxLength={6}
                      />
                      <ShieldCheck className="absolute left-3 top-3.5 text-leather-400" size={18} />
                    </div>
                    <button
                      onClick={() => {
                        if (forgotData.otp === forgotData.generatedOtp) {
                          setForgotStep('reset');
                        } else {
                          showToast("Invalid OTP", "error");
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 rounded-xl font-bold hover:from-leather-900 hover:to-leather-800 border border-gold-500/40 shadow-sm transition-all cursor-pointer"
                    >
                      Verify OTP
                    </button>
                    <button onClick={() => setForgotStep('username')} className="w-full py-2 text-xs font-bold text-leather-700 hover:text-leather-950 flex items-center justify-center gap-1"><ArrowLeft size={12} /> Back to Username</button>
                  </div>
                )}

                {forgotStep === 'reset' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (forgotData.newPassword !== forgotData.confirmPassword) return showToast("Passwords don't match", "error");
                    if (forgotData.newPassword.length < 4) return showToast("Password too short", "error");

                    setIsForgotLoading(true);
                    try {
                      const { error } = await supabase.from('users').update({ password: forgotData.newPassword }).eq('user_name', forgotData.username);
                      if (error) throw error;
                      showToast("Password reset successfully!", "success");
                      setShowForgotModal(false);
                      setForgotStep('username');
                      setForgotData({ username: "", otp: "", newPassword: "", confirmPassword: "", generatedOtp: "" });
                    } catch (err) {
                      showToast("Error resetting password", "error");
                    } finally {
                      setIsForgotLoading(false);
                    }
                  }} className="space-y-4">
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="New Password"
                        required
                        value={forgotData.newPassword}
                        onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                      />
                      <KeyRound className="absolute left-3 top-3.5 text-leather-400" size={18} />
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        required
                        value={forgotData.confirmPassword}
                        onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                      />
                      <ShieldCheck className="absolute left-3 top-3.5 text-leather-400" size={18} />
                    </div>
                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      className="w-full py-3 bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 rounded-xl font-bold hover:from-leather-900 hover:to-leather-800 border border-gold-500/40 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isForgotLoading ? <RefreshCw className="animate-spin" size={18} /> : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-leather-950/60 backdrop-blur-xs animate-in fade-in duration-300" onClick={() => !isChangeLoading && setShowChangeModal(false)}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-leather-200">
              <div className="bg-gradient-to-br from-cream-100 to-white px-6 py-6 text-center border-b border-leather-100">
                <div className="mx-auto w-16 h-16 bg-cream-100 border border-gold-400/40 rounded-full flex items-center justify-center mb-4 shadow-xs">
                  <KeyRound className="text-leather-800" size={30} />
                </div>
                <h3 className="text-xl font-black text-leather-900 leading-tight font-serif">
                  Change Password
                </h3>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (changeData.newPassword !== changeData.confirmPassword) {
                  return showToast("New passwords do not match", "error");
                }
                if (changeData.newPassword.length < 4) {
                  return showToast("Password too short (min 4 characters)", "error");
                }

                setIsChangeLoading(true);
                try {
                  const { data: user, error: fetchError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('user_name', changeData.username)
                    .eq('password', changeData.currentPassword)
                    .maybeSingle();

                  if (fetchError || !user) {
                    showToast("Invalid username or current password", "error");
                    setIsChangeLoading(false);
                    return;
                  }

                  const { error: updateError } = await supabase
                    .from('users')
                    .update({ password: changeData.newPassword })
                    .eq('id', user.id);

                  if (updateError) throw updateError;

                  showToast("Password changed successfully!", "success");
                  setShowChangeModal(false);
                  setChangeData({ username: "", currentPassword: "", newPassword: "", confirmPassword: "" });
                } catch (err) {
                  console.error("Change Password Error:", err);
                  showToast("Error changing password", "error");
                } finally {
                  setIsChangeLoading(false);
                }
              }} className="px-6 pb-8 space-y-4 pt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    value={changeData.username}
                    onChange={(e) => setChangeData({ ...changeData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                  />
                  <UserIcon className="absolute left-3 top-3.5 text-leather-400" size={18} />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Current Password"
                    required
                    value={changeData.currentPassword}
                    onChange={(e) => setChangeData({ ...changeData, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                  />
                  <KeyRound className="absolute left-3 top-3.5 text-leather-400" size={18} />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="New Password"
                    required
                    value={changeData.newPassword}
                    onChange={(e) => setChangeData({ ...changeData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                  />
                  <ShieldCheck className="absolute left-3 top-3.5 text-leather-400" size={18} />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    required
                    value={changeData.confirmPassword}
                    onChange={(e) => setChangeData({ ...changeData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-leather-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-500 outline-none text-sm text-leather-900 transition-all"
                  />
                  <ShieldCheck className="absolute left-3 top-3.5 text-leather-400" size={18} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isChangeLoading}
                    onClick={() => {
                      setShowChangeModal(false);
                      setChangeData({ username: "", currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    className="w-1/2 py-3 bg-cream-100 text-leather-700 rounded-xl font-bold hover:bg-cream-200 transition-all text-center text-sm border border-leather-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangeLoading}
                    className="w-1/2 py-3 bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 rounded-xl font-bold hover:from-leather-900 hover:to-leather-800 border border-gold-500/40 shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isChangeLoading ? <RefreshCw className="animate-spin" size={18} /> : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="fixed left-0 right-0 bottom-0 py-1.5 px-4 bg-gradient-to-r from-leather-950 via-leather-900 to-leather-950 text-cream-200 text-center text-xs shadow-md z-10 border-t border-gold-500/30">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-gold-300 transition-colors"
          >
            Powered by — <span className="font-semibold text-gold-400">Botivate</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
