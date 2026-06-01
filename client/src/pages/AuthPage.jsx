import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://smart-library-api-1e3s.onrender.com/api/auth';

const initialForm = {
  name: '',
  rid: '',
  email: '',
  password: '',
  role: 'student',
};

const AuthPage = () => {

  const {
    isAuthenticated,
    user,
    login,
  } = useAuth();

  const [isRegister, setIsRegister] =
    useState(false);

  const [otpSent, setOtpSent] =
    useState(false);

  const [otp, setOtp] =
    useState('');

  const [form, setForm] =
    useState(initialForm);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  // =====================================
  // REDIRECT
  // =====================================

  if (isAuthenticated) {
    return (
      <Navigate
        to={
          user?.role === 'admin'
            ? '/admin'
            : '/student'
        }
        replace
      />
    );
  }

  // =====================================
  // REGISTER / LOGIN
  // =====================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError('');
    setSuccess('');

    // =====================================
    // VALIDATION
    // =====================================

    if (
      isRegister &&
      !form.name.trim()
    ) {

      setError(
        'Full name is required'
      );

      return;
    }

    if (
      isRegister &&
      !/^R\d{5}$/i.test(
        form.rid.trim()
      )
    ) {

      setError(
        'RID format must be like R43123'
      );

      return;
    }

    if (
      !form.email.trim() ||
      !form.password.trim()
    ) {

      setError(
        'Email and password are required'
      );

      return;
    }

    setLoading(true);

    try {

      // =====================================
      // REGISTER
      // =====================================

      if (isRegister) {

        console.log(
          'Sending register request...'
        );

        const response =
          await axios.post(
            `${API_URL}/register`,
            {
              ...form,

              name:
                form.name.trim(),

              rid:
                form.rid
                  .trim()
                  .toUpperCase(),

              email:
                form.email.trim(),
            }
          );

        console.log(
          response.data
        );

        // =====================================
        // SHOW OTP SCREEN
        // =====================================

        setOtpSent(true);

        setSuccess(
          response.data.message ||
          'OTP sent successfully'
        );
      }

      // =====================================
      // LOGIN
      // =====================================

      else {

        await login(
          {
            ...form,

            email:
              form.email.trim(),
          },
          false
        );
      }

    } catch (err) {

      console.error(err);

      const message =
        err.response?.data
          ?.message ||
        err.message ||
        'Authentication failed';

      setError(message);

    } finally {

      setLoading(false);
    }
  };

  // =====================================
  // VERIFY OTP
  // =====================================

  const handleVerifyOtp =
    async () => {

      try {

        setLoading(true);

        setError('');

        const response =
          await axios.post(
            `${API_URL}/verify-otp`,
            {
              email:
                form.email,

              otp,
            }
          );

        console.log(
          response.data
        );

        localStorage.setItem(
          'token',
          response.data.token
        );

        setSuccess(
          'Email verified successfully'
        );

        // REDIRECT

        window.location.href =
          '/student';

      } catch (err) {

        console.error(err);

        const message =
          err.response?.data
            ?.message ||
          'OTP verification failed';

        setError(message);

      } finally {

        setLoading(false);
      }
    };

  return (

    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">

        {/* LEFT */}

        <section className="bg-gradient-to-br from-indigo-700 via-slate-900 to-slate-950 p-10 text-white">

          <div className="inline-flex rounded-2xl bg-white/10 p-3">
            <BookOpen className="h-8 w-8" />
          </div>

          <p className="mt-8 text-sm uppercase tracking-[0.3em] text-indigo-200">
            Smart Library
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Secure Library Management
            with Email OTP Verification
          </h1>

        </section>

        {/* RIGHT */}

        <section className="p-8 sm:p-10">

          <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-600">

            {otpSent
              ? 'Verify OTP'
              : isRegister
              ? 'Create Student Account'
              : 'Welcome Back'}

          </p>

          <h2 className="mt-3 text-3xl font-semibold text-slate-900">

            {otpSent
              ? 'Enter Email OTP'
              : isRegister
              ? 'Student Registration'
              : 'Login to Dashboard'}

          </h2>

          {/* ===================================== */}
          {/* OTP SCREEN */}
          {/* ===================================== */}

          {otpSent ? (

            <div className="mt-8 space-y-4">

              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"

                placeholder="Enter 6 Digit OTP"

                value={otp}

                onChange={(e) =>
                  setOtp(
                    e.target.value
                  )
                }
              />

              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              )}

              <button
                onClick={
                  handleVerifyOtp
                }

                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white"

                disabled={loading}
              >

                {loading
                  ? 'Verifying...'
                  : 'Verify OTP'}

              </button>

            </div>

          ) : (

            <form
              onSubmit={
                handleSubmit
              }

              className="mt-8 space-y-4"
            >

              {/* REGISTER */}

              {isRegister && (
                <>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"

                    placeholder="Full Name"

                    value={form.name}

                    onChange={(e) =>
                      setForm({
                        ...form,
                        name:
                          e.target.value,
                      })
                    }
                  />

                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"

                    placeholder="R ID (example: R43123)"

                    value={form.rid}

                    onChange={(e) =>
                      setForm({
                        ...form,
                        rid:
                          e.target.value,
                      })
                    }
                  />
                </>
              )}

              {/* LOGIN ROLE */}

              {!isRegister && (
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"

                  value={form.role}

                  onChange={(e) =>
                    setForm({
                      ...form,
                      role:
                        e.target.value,
                    })
                  }
                >
                  <option value="student">
                    Student Login
                  </option>

                  <option value="admin">
                    Admin Login
                  </option>
                </select>
              )}

              {/* EMAIL */}

              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"

                type="email"

                placeholder="University Email"

                value={form.email}

                onChange={(e) =>
                  setForm({
                    ...form,
                    email:
                      e.target.value,
                  })
                }
              />

              {/* PASSWORD */}

              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"

                type="password"

                placeholder="Password"

                value={form.password}

                onChange={(e) =>
                  setForm({
                    ...form,
                    password:
                      e.target.value,
                  })
                }
              />

              {/* ERROR */}

              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </p>
              )}

              {/* SUCCESS */}

              {success && (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              )}

              {/* BUTTON */}

              <button
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white"

                disabled={loading}
              >

                {loading
                  ? 'Please wait...'
                  : isRegister
                  ? 'Register'
                  : 'Login'}

              </button>

            </form>
          )}

          {/* TOGGLE */}

          {!otpSent && (
            <button
              onClick={() => {

                setIsRegister(
                  (value) => !value
                );

                setError('');

                setSuccess('');

                setForm(
                  initialForm
                );
              }}

              className="mt-4 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >

              {isRegister
                ? 'Already have an account? Login'
                : 'Need a student account? Register'}

            </button>
          )}

        </section>
      </div>
    </div>
  );
};

export default AuthPage;
