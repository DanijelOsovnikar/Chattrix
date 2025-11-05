import { useState } from "react";
import useLogin from "../../context/hooks/useLogin";
import FloatingIcons from "../../components/FloatingIcons";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isShowingPassword, setIsShowingPassword] = useState(false);
  const { loading, login } = useLogin();

  const handleSubmitFunc = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-w-80 max-w-96 w-full mx-auto max-[500px]:px-8">
      <FloatingIcons />
      <div className="z-50 bg-base-100 w-full p-6 rounded-[16px] border border-[#DEE1E6] shadow-[0_0_1px_#171a1f,0_0_2px_#171a1f14] bg-clip-padding backdrop-filter backdrop-blur-1">
        <h1 className="text-3xl font-semibold text-center text-primary-color">
          Chattrix
        </h1>
        <p className="text-[14px] leading-[20px] font-normal text-[#565D6D] w-full text-center mt-2 mb-6">
          Sign in to your account to continue.
        </p>
        <form onSubmit={handleSubmitFunc}>
          <div>
            <label className="label p-2">
              <span className="text-base label-text">Username</span>
            </label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full input input-bordered h-10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="relative">
            <label className="label">
              <span className="text-base label-text">Password</span>
            </label>
            <input
              type={isShowingPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full input input-bordered h-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-12 text-gray-600 hover:text-gray-800"
              onClick={() => setIsShowingPassword(!isShowingPassword)}
            >
              {isShowingPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </button>
          </div>
          <div>
            <button
              disabled={loading}
              className="btn bg-primary text-white btn-block btn-md mt-10 font-semibold leading-6 text-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div
                  className={`mx-auto animate-spin shrink-0 rounded-full border-solid dark:border-t-transparent border-t-transparent border-gray-400 h-6 w-6 border-[3px]`}
                />
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
