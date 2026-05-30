import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PATHS, mapToArray, dbListen, dbPush, dbUpdate } from '../services/rtdb';
import { notifyAdminInbox } from '../services/adminInbox';
import { formatDeviceDateTime } from '../utils/deviceSchedule';
import { useAuth } from './AuthContext';

const BookingContext = createContext(null);
const LOAD_TIMEOUT_MS = 5000;

export const BookingProvider = ({ children }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const gotRemoteRef = useRef(false);

  useEffect(() => {
    gotRemoteRef.current = false;

    if (!user?.id) {
      setBookings([]);
      setBookingsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setBookingsLoading(true);

    const timeout = setTimeout(() => {
      if (!cancelled && !gotRemoteRef.current) {
        setBookingsLoading(false);
      }
    }, LOAD_TIMEOUT_MS);

    const unsub = dbListen(PATHS.userBookings(user.id), (val) => {
      if (cancelled) return;
      gotRemoteRef.current = true;
      const list = mapToArray(val).sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
      );
      setBookings(list);
      setBookingsLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsub();
    };
  }, [user?.id]);

  const addBooking = useCallback(
    async (booking) => {
      if (!user?.id) throw new Error('You must be signed in to book');

      const now = new Date();
      const payload = {
        ...booking,
        status: 'pending',
        statusHistory: [{ status: 'pending', time: now.toISOString() }],
        bookingRef: `OM-${now.getFullYear()}-${String(Date.now()).slice(-6)}`,
        createdAt: now.toISOString(),
        scheduledLabel: formatDeviceDateTime(booking.date, booking.time),
      };

      const tempId = `local_${Date.now()}`;
      const optimistic = { ...payload, id: tempId };
      setBookings((prev) => [optimistic, ...prev]);

      try {
        const id = await dbPush(PATHS.userBookings(user.id), payload);
        const saved = { ...payload, id };
        setBookings((prev) => [saved, ...prev.filter((b) => b.id !== tempId)]);
        notifyAdminInbox({
          type: 'booking',
          title: 'New booking',
          message: `${payload.serviceName} · ${payload.bookingRef}`,
          meta: {
            bookingId: id,
            userId: user.id,
            serviceId: payload.serviceId,
            bookingRef: payload.bookingRef,
            scheduledLabel: payload.scheduledLabel,
          },
        });
        return saved;
      } catch (e) {
        console.warn('addBooking remote:', e?.message);
        throw e;
      }
    },
    [user?.id],
  );

  const updateBookingStatus = useCallback(
    async (bookingId, status) => {
      if (!user?.id) return;
      const existing = bookings.find((b) => b.id === bookingId);
      if (!existing) return;

      const updated = {
        ...existing,
        status,
        statusHistory: [
          ...(existing.statusHistory || []),
          { status, time: new Date().toISOString() },
        ],
      };

      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));

      if (!bookingId.startsWith('local_')) {
        try {
          await dbUpdate(`${PATHS.userBookings(user.id)}/${bookingId}`, {
            status,
            statusHistory: updated.statusHistory,
          });
        } catch (err) {
          console.warn('updateBookingStatus:', err?.message);
        }
      }
    },
    [user?.id, bookings],
  );

  const cancelBooking = useCallback(
    (bookingId) => updateBookingStatus(bookingId, 'cancelled'),
    [updateBookingStatus],
  );

  const addReview = useCallback(
    async (bookingId, rating, comment) => {
      if (!user?.id) return;
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, review: { rating, comment } } : b)),
      );
      if (!bookingId.startsWith('local_')) {
        try {
          await dbUpdate(`${PATHS.userBookings(user.id)}/${bookingId}`, {
            review: { rating, comment },
          });
        } catch (err) {
          console.warn('addReview:', err?.message);
        }
      }
    },
    [user?.id],
  );

  const getActiveBookings = useCallback(
    () => bookings.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status)),
    [bookings],
  );

  const getPastBookings = useCallback(
    () => bookings.filter((b) => ['completed', 'cancelled'].includes(b.status)),
    [bookings],
  );

  return (
    <BookingContext.Provider
      value={{
        bookings,
        bookingsLoading,
        cart,
        setCart,
        addBooking,
        updateBookingStatus,
        cancelBooking,
        addReview,
        getActiveBookings,
        getPastBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
};
