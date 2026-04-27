import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Lock, KeyRound, ArrowLeft, ShieldCheck } from "lucide-react";
import { API_URL } from "@/src/api_config";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";

interface ForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "request" | "reset" | "success";

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<Step>("request");
  const [role, setRole] = useState<"parent" | "child">("child");
  const [username, setUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const resetForm = () => {
    setStep("request");
    setUsername("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
    setSuccessMsg("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step 1: 提交用户名，获取重置码
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(
          `验证码已生成！\n\n如果是孩子账号，请联系家庭管理员获取重置码。\n\n家长可以在管理面板中查看重置码。`
        );
        // 自动填入重置码（如果是开发者自测场景）
        if (data.reset_code) {
          setResetCode(data.reset_code);
        }
        setStep("reset");
      } else {
        const errData = await res.json();
        setError(errData.detail || "请求失败，请检查用户名是否正确");
      }
    } catch (err) {
      console.error("Forgot password error", err);
      setError("网络请求失败，请检查服务是否开启");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 输入重置码和新密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resetCode.trim()) {
      setError("请输入重置码");
      return;
    }
    if (!newPassword) {
      setError("请输入新密码");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码长度至少为 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          reset_code: resetCode.trim(),
          new_password: newPassword,
        }),
      });

      if (res.ok) {
        setStep("success");
        setSuccessMsg("密码重置成功！请使用新密码登录。");
      } else {
        const errData = await res.json();
        setError(errData.detail || "重置失败，请检查重置码是否正确");
      }
    } catch (err) {
      console.error("Reset password error", err);
      setError("网络请求失败，请检查服务是否开启");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative z-10 border border-outline/10"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(["request", "reset", "success"] as const).map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-0.5 w-8 rounded-full transition-colors",
                        step === s || (step === "success" && s === "reset")
                          ? "bg-primary"
                          : "bg-outline-variant/30"
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step === s ||
                        (step === "success" && (s === "reset" || s === "request"))
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface-container-high text-on-surface-variant/60"
                    )}
                  >
                    {i + 1}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Request Reset Code */}
            {step === "request" && (
              <form onSubmit={handleRequestReset} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">
                    忘记密码
                  </h3>
                  <p className="text-sm text-on-surface-variant/80 leading-relaxed">
                    请输入您的用户名和角色，系统将生成一个重置码。
                    <br />
                    <span className="font-bold">
                      孩子账号请联系家长获取重置码。
                    </span>
                  </p>
                </div>

                {/* Role Selector */}
                <div className="bg-surface-container-low p-1 rounded-full flex gap-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setRole("child")}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-full font-semibold text-sm transition-all",
                      role === "child"
                        ? "bg-primary text-white shadow-md"
                        : "text-on-surface-variant"
                    )}
                  >
                    我是孩子
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("parent")}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-full font-semibold text-sm transition-all",
                      role === "parent"
                        ? "bg-primary text-white shadow-md"
                        : "text-on-surface-variant"
                    )}
                  >
                    我是家长
                  </button>
                </div>

                <Input
                  label="用户名"
                  placeholder="请输入您的用户名"
                  icon={<User size={20} />}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

                {error && (
                  <p className="text-red-500 text-sm font-bold text-center animate-pulse">
                    {error}
                  </p>
                )}

                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? "处理中..." : "获取重置码"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-sm text-on-surface-variant hover:text-on-surface font-medium transition-colors"
                  >
                    返回登录
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter Reset Code & New Password */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 mb-2">
                    <KeyRound size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">
                    重置密码
                  </h3>
                  <p className="text-sm text-on-surface-variant/80 leading-relaxed">
                    请输入从家长那里获取的
                    <span className="font-bold text-primary"> 6 位重置码</span>
                    ，并设置新密码。
                  </p>
                </div>

                <div className="bg-violet-50/50 border border-violet-200/50 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-violet-600/60 uppercase tracking-widest mb-1">
                    账号
                  </p>
                  <p className="font-bold text-on-surface text-lg">
                    {username}
                  </p>
                  <p className="text-[10px] font-bold text-violet-600/60 uppercase tracking-widest mt-2">
                    角色
                  </p>
                  <p className="text-sm font-bold text-on-surface-variant">
                    {role === "parent" ? "家长" : "孩子"}
                  </p>
                </div>

                <Input
                  label="重置码"
                  placeholder="请输入 6 位重置码"
                  icon={<KeyRound size={20} />}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  maxLength={6}
                />

                <Input
                  label="新密码"
                  type="password"
                  placeholder="请输入 6-16 位新密码"
                  icon={<Lock size={20} />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <Input
                  label="确认新密码"
                  type="password"
                  placeholder="请再次输入新密码"
                  icon={<ShieldCheck size={20} />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {error && (
                  <p className="text-red-500 text-sm font-bold text-center animate-pulse">
                    {error}
                  </p>
                )}

                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? "重置中..." : "确认重置"}
                </Button>

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setError("");
                    }}
                    className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface font-medium transition-colors"
                  >
                    <ArrowLeft size={16} />
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-sm text-on-surface-variant hover:text-on-surface font-medium transition-colors"
                  >
                    返回登录
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="space-y-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30"
                >
                  <ShieldCheck size={40} />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">
                    🎉 密码重置成功！
                  </h3>
                  <p className="text-sm text-on-surface-variant/80 leading-relaxed">
                    {successMsg}
                  </p>
                </div>

                {resetCode && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mb-1">
                      使用的重置码
                    </p>
                    <p className="text-2xl font-black text-green-600 tracking-[0.3em]">
                      {resetCode}
                    </p>
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={handleClose}
                  className="bg-primary hover:opacity-90"
                >
                  返回登录
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ForgotPassword;
