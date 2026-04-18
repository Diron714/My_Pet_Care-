/**
 * Shared access check for chat rooms (REST + Socket.IO).
 * @returns {{ allowed: boolean, notFound: boolean }}
 */
export async function checkChatRoomAccess(pool, roomId, userId, userRole) {
  const [rooms] = await pool.query(
    `SELECT cr.customer_id, cr.doctor_id, cr.staff_id,
            c.user_id AS customer_user_id,
            d.user_id AS doctor_user_id
     FROM chat_rooms cr
     LEFT JOIN customers c ON cr.customer_id = c.customer_id
     LEFT JOIN doctors d ON cr.doctor_id = d.doctor_id
     WHERE cr.room_id = ? AND cr.is_active = TRUE`,
    [roomId]
  );
  if (rooms.length === 0) return { allowed: false, notFound: true };
  const r = rooms[0];
  const isCustomer = r.customer_user_id === userId;
  const isAssignedSupport = r.staff_id === userId;
  const normalizedRole = String(userRole || '').trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'staff';
  const allowed = isCustomer || isAssignedSupport || isAdmin;
  return { allowed, notFound: false };
}
