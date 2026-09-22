import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Clock3,
  FileText,
  Gift,
  MessageCircle,
  UserCheck,
  WalletCards,
} from "lucide-react";

export default function EmployeeHome({
  currentUser,
  setPage,
  holidays = [],
}) {
  const [now, setNow] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [loginTime, setLoginTime] = useState(null);
  const [logoutTime, setLogoutTime] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const employeeName =
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Employee";

  const hour = now.getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 17
      ? "Good Afternoon"
      : "Good Evening";

  const handleClockIn = () => {
    const time = new Date();

    setClockedIn(true);
    setLoginTime(time);
    setLogoutTime(null);

    const attendance = JSON.parse(
      localStorage.getItem("payroll_attendance") || "[]"
    );

    attendance.push({
      id: Date.now(),
      employee: employeeName,
      email: currentUser?.email || "",
      action: "Login",
      time: time.toISOString(),
      date: time.toLocaleDateString(),
    });

    localStorage.setItem(
      "payroll_attendance",
      JSON.stringify(attendance)
    );
  };

  const handleClockOut = () => {
    const time = new Date();

    setClockedIn(false);
    setLogoutTime(time);

    const attendance = JSON.parse(
      localStorage.getItem("payroll_attendance") || "[]"
    );

    attendance.push({
      id: Date.now(),
      employee: employeeName,
      email: currentUser?.email || "",
      action: "Logout",
      time: time.toISOString(),
      date: time.toLocaleDateString(),
    });

    localStorage.setItem(
      "payroll_attendance",
      JSON.stringify(attendance)
    );
  };

  const formatTime = (date) => {
    if (!date) return "--:--";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const upcomingHoliday = holidays[0];

  return (
    <div className="employee-home-page">

      {/* TOP HEADER */}
      <div className="welcome-row">
        <div>
          <div className="page-eyebrow">EMPLOYEE PORTAL</div>

          <h1>
            {greeting}, {employeeName}
          </h1>

          <p>
            Welcome back. Here is your work overview for today.
          </p>
        </div>

        <div className="top-actions">

          <button className="icon-button">
            <Bell size={20} />
            <span className="notification-dot" />
          </button>

          <div className="mini-profile">
            <div className="avatar">
              {employeeName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{employeeName}</strong>
              <span>Employee</span>
            </div>
          </div>

        </div>
      </div>

      {/* ANNOUNCEMENT MARQUEE */}
      <div className="employee-announcement">
        <div className="announcement-label">
          <Bell size={17} />
          <strong>IMPORTANT</strong>
        </div>

        <div className="announcement-marquee">
          <div className="announcement-track">
            <span>
              Welcome {employeeName}! Please check your leave requests,
              holidays and latest salary slip regularly.
            </span>

            <span>
              Important announcement: Please ensure your attendance
              is recorded correctly every working day.
            </span>

            <span>
              PayRoll Pro employee services are available from the
              dashboard menu.
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CLOCK */}
      <div className="employee-clock-card">

        <div className="employee-clock-left">

          <div className="employee-clock-icon">
            <Clock3 size={24} />
          </div>

          <div>
            <span className="clock-label">
              CURRENT TIME
            </span>

            <div className="live-time">
              {formatTime(now)}
            </div>

            <p>
              {now.toLocaleDateString([], {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

        </div>

        <div className="employee-clock-status">

          <div className="employee-attendance-status">

            <span
              className={
                clockedIn
                  ? "clock-status active"
                  : "clock-status"
              }
            >
              <i />
              {clockedIn ? "Present" : "Not Present"}
            </span>

            {loginTime && (
              <small>
                Login: {formatTime(loginTime)}
              </small>
            )}

            {logoutTime && (
              <small>
                Logout: {formatTime(logoutTime)}
              </small>
            )}

          </div>

          {!clockedIn ? (
            <button
              className="clock-in-button"
              onClick={handleClockIn}
            >
              CLOCK IN
            </button>
          ) : (
            <button
              className="clock-out-button"
              onClick={handleClockOut}
            >
              CLOCK OUT
            </button>
          )}

        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">

        <div className="stat-card green">
          <div className="stat-icon">
            <UserCheck size={21} />
          </div>

          <div className="stat-content">
            <span>Attendance</span>

            <strong>
              {clockedIn ? "Present" : "Not Present"}
            </strong>

            <small>
              {clockedIn
                ? `Logged in at ${formatTime(loginTime)}`
                : "Not clocked in"}
            </small>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <CalendarDays size={21} />
          </div>

          <div className="stat-content">
            <span>Leave Balance</span>

            <strong>12</strong>

            <small>Available leaves</small>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <CalendarDays size={21} />
          </div>

          <div className="stat-content">
            <span>Pending Requests</span>

            <strong>0</strong>

            <small>Leave requests pending</small>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">
            <WalletCards size={21} />
          </div>

          <div className="stat-content">
            <span>Latest Salary</span>

            <strong>August</strong>

            <small>Salary slip available</small>
          </div>
        </div>

      </div>

      {/* QUICK OPERATIONS */}
      <div className="section-title">
        <div>
          <h2>Employee Operations</h2>
          <p>
            Access your employee services
          </p>
        </div>
      </div>

      <div className="quick-grid">

        <button
          className="quick-card blue-card"
          onClick={() => setPage("apply-leave")}
        >
          <CalendarDays size={24} />

          <div>
            <strong>Apply For Leave</strong>
            <span>
              Submit a new leave request
            </span>
          </div>
        </button>

        <button
          className="quick-card purple-card"
          onClick={() => setPage("holidays")}
        >
          <Gift size={24} />

          <div>
            <strong>Holiday List</strong>
            <span>
              View upcoming holidays
            </span>
          </div>
        </button>

        <button
          className="quick-card green-card"
          onClick={() => setPage("salary-slip")}
        >
          <FileText size={24} />

          <div>
            <strong>Salary Slip</strong>
            <span>
              View your latest salary slip
            </span>
          </div>
        </button>

        <button
          className="quick-card orange-card"
          onClick={() => setPage("chat")}
        >
          <MessageCircle size={24} />

          <div>
            <strong>Chat With Admin</strong>
            <span>
              Contact payroll administrator
            </span>
          </div>
        </button>

      </div>

      {/* BOTTOM INFORMATION */}
      <div className="home-two-column">

        <div className="panel">

          <div className="panel-header">
            <div>
              <h3>Next Holiday</h3>
              <span>
                Company holiday calendar
              </span>
            </div>

            <button
              onClick={() => setPage("holidays")}
            >
              View all
            </button>
          </div>

          {upcomingHoliday ? (
            <div className="holiday-row">

              <div className="holiday-date">
                <strong>
                  {new Date(
                    upcomingHoliday.date
                  ).getDate()}
                </strong>

                <span>
                  {new Date(
                    upcomingHoliday.date
                  ).toLocaleString("en", {
                    month: "short",
                  })}
                </span>
              </div>

              <div>
                <strong>
                  {upcomingHoliday.name}
                </strong>

                <span>
                  {upcomingHoliday.day}
                </span>
              </div>

            </div>
          ) : (
            <div className="empty-small">
              No upcoming holidays.
            </div>
          )}

        </div>

        <div className="panel salary-preview">

          <div className="panel-header">

            <div>
              <h3>Latest Salary Slip</h3>
              <span>
                August 2026
              </span>
            </div>

            <WalletCards size={22} />

          </div>

          <div className="salary-preview-content">

            <span>
              Salary slip generated by admin
            </span>

            <button
              className="primary-small"
              onClick={() =>
                setPage("salary-slip")
              }
            >
              View Salary Slip
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}