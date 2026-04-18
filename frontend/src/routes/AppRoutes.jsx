import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import RequireAuth from '../components/common/RequireAuth';
import Layout from '../components/layout/Layout';
import PublicRoutes from './PublicRoutes';

import CustomerDashboard from '../pages/customer/Dashboard';
import CustomerPetListing from '../pages/customer/PetListing';
import CustomerPetDetails from '../pages/customer/PetDetails';
import CustomerProductListing from '../pages/customer/ProductListing';
import CustomerProductDetails from '../pages/customer/ProductDetails';
import CustomerCart from '../pages/customer/Cart';
import CustomerCheckout from '../pages/customer/Checkout';
import CustomerOrders from '../pages/customer/Orders';
import CustomerOrderDetails from '../pages/customer/OrderDetails';
import CustomerDoctorList from '../pages/customer/DoctorList';
import CustomerDoctorDetails from '../pages/customer/DoctorDetails';
import CustomerAppointments from '../pages/customer/Appointments';
import CustomerAppointmentDetails from '../pages/customer/AppointmentDetails';
import CustomerBookAppointment from '../pages/customer/BookAppointment';
import CustomerPetProfiles from '../pages/customer/PetProfiles';
import CustomerPetProfileForm from '../pages/customer/PetProfileForm';
import CustomerHealthRecords from '../pages/customer/HealthRecords';
import CustomerExchangeRequests from '../pages/customer/ExchangeRequests';
import CustomerPreBookings from '../pages/customer/PreBookings';
import CustomerChat from '../pages/customer/Chat';
import CustomerFeedback from '../pages/customer/Feedback';
import CustomerNotifications from '../pages/customer/Notifications';
import CustomerOffers from '../pages/customer/Offers';
import CustomerReminders from '../pages/customer/Reminders';

import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorProfileManagement from '../pages/doctor/ProfileManagement';
import DoctorScheduleManagement from '../pages/doctor/ScheduleManagement';
import DoctorAppointments from '../pages/doctor/Appointments';
import DoctorAppointmentDetails from '../pages/doctor/AppointmentDetails';
import DoctorHealthRecords from '../pages/doctor/HealthRecords';
import DoctorHealthRecordForm from '../pages/doctor/HealthRecordForm';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminPetManagement from '../pages/admin/PetManagement';
import AdminProductManagement from '../pages/admin/ProductManagement';
import AdminOrderManagement from '../pages/admin/OrderManagement';
import AdminUserManagement from '../pages/admin/UserManagement';
import AdminExchangeManagement from '../pages/admin/ExchangeManagement';
import AdminPreBookingManagement from '../pages/admin/PreBookingManagement';
import AdminOfferManagement from '../pages/admin/OfferManagement';
import AdminFeedbackModeration from '../pages/admin/FeedbackModeration';
import AdminNotificationManagement from '../pages/admin/NotificationManagement';
import AdminReports from '../pages/admin/Reports';
import AdminChat from '../pages/admin/Chat';

/** Admin area: shared shell + explicit absolute paths (avoids nested /admin/* + Outlet bugs). */
const DashboardShell = () => {
  const location = useLocation();
  return (
    <Layout>
      <div key={location.pathname} className="content-area animate-in fade-in duration-200">
        <Outlet />
      </div>
    </Layout>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Customer: pathless layout + absolute paths */}
        <Route
          element={
            <RequireAuth roles={['customer']}>
              <Outlet />
            </RequireAuth>
          }
        >
          <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/pets" element={<CustomerPetListing />} />
          <Route path="/customer/pets/:id" element={<CustomerPetDetails />} />
          <Route path="/customer/products" element={<CustomerProductListing />} />
          <Route path="/customer/products/:id" element={<CustomerProductDetails />} />
          <Route path="/customer/cart" element={<CustomerCart />} />
          <Route path="/customer/checkout" element={<CustomerCheckout />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/customer/orders/:id" element={<CustomerOrderDetails />} />
          <Route path="/customer/doctors" element={<CustomerDoctorList />} />
          <Route path="/customer/doctors/:id" element={<CustomerDoctorDetails />} />
          <Route path="/customer/appointments" element={<CustomerAppointments />} />
          <Route path="/customer/appointments/book" element={<CustomerBookAppointment />} />
          <Route path="/customer/appointments/:id" element={<CustomerAppointmentDetails />} />
          <Route path="/customer/pet-profiles" element={<CustomerPetProfiles />} />
          <Route path="/customer/pet-profiles/new" element={<CustomerPetProfileForm />} />
          <Route path="/customer/pet-profiles/:id/edit" element={<CustomerPetProfileForm />} />
          <Route path="/customer/health-records" element={<CustomerHealthRecords />} />
          <Route path="/customer/exchanges" element={<CustomerExchangeRequests />} />
          <Route path="/customer/pre-bookings" element={<CustomerPreBookings />} />
          <Route path="/customer/chat" element={<CustomerChat />} />
          <Route path="/customer/feedback" element={<CustomerFeedback />} />
          <Route path="/customer/notifications" element={<CustomerNotifications />} />
          <Route path="/customer/offers" element={<CustomerOffers />} />
          <Route path="/customer/reminders" element={<CustomerReminders />} />
          <Route path="/customer/*" element={<Navigate to="/customer/dashboard" replace />} />
        </Route>

        {/* Doctor */}
        <Route
          element={
            <RequireAuth roles={['doctor']}>
              <Outlet />
            </RequireAuth>
          }
        >
          <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/profile" element={<DoctorProfileManagement />} />
          <Route path="/doctor/schedule" element={<DoctorScheduleManagement />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetails />} />
          <Route path="/doctor/health-records" element={<DoctorHealthRecords />} />
          <Route path="/doctor/health-records/new" element={<DoctorHealthRecordForm />} />
          <Route path="/doctor/health-records/:id/edit" element={<DoctorHealthRecordForm />} />
          <Route path="/doctor/notifications" element={<CustomerNotifications />} />
          <Route path="/doctor/*" element={<Navigate to="/doctor/dashboard" replace />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <RequireAuth roles={['admin', 'staff']}>
              <DashboardShell />
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/pets" element={<AdminPetManagement />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/orders" element={<AdminOrderManagement />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/exchanges" element={<AdminExchangeManagement />} />
          <Route path="/admin/pre-bookings" element={<AdminPreBookingManagement />} />
          <Route path="/admin/offers" element={<AdminOfferManagement />} />
          <Route path="/admin/feedback" element={<AdminFeedbackModeration />} />
          <Route path="/admin/notifications" element={<AdminNotificationManagement />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/chat" element={<AdminChat />} />
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="/*" element={<PublicRoutes />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
