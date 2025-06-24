import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import BookingModal from "./BookModal";
import toast, { Toaster } from "react-hot-toast";


const Dashboard = () => {
  const { socket,logout, apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [rooms, setRooms] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    room: null,
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomHistory, setRoomHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

 useEffect(() => {
    fetchData();

    if (!socket) return; // Only set up listeners if socket exists

    // Set up Socket.IO listeners
    socket.on('roomsUpdated', (updatedRooms) => {
      setRooms(updatedRooms);
    });

    socket.on('professorsUpdated', (updatedProfessor) => {
      setProfessors((prev) =>
        prev.map((prof) =>
          prof._id === updatedProfessor.id
            ? { ...prof, ...updatedProfessor }
            : prof
        )
      );
    });

    socket.on('bookingCreated', (newBooking) => {
      setActiveBookings((prev) => [...prev, newBooking]);
      setMyBookings((prev) => {
        if (newBooking.professor._id === apiCall.user?.userId) {
          return [...prev, newBooking];
        }
        return prev;
      });
    });

    socket.on('bookingEnded', ({ bookingId }) => {
      setActiveBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setMyBookings((prev) => prev.filter((b) => b._id !== bookingId));
    });

    // Cleanup on component unmount
    return () => {
      socket.off('roomsUpdated');
      socket.off('professorsUpdated');
      socket.off('bookingCreated');
      socket.off('bookingEnded');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, professorsData, bookingsData, myBookingsData] =
        await Promise.all([
          apiCall("/rooms"),
          apiCall("/professors/get-status"), // Fixed endpoint
          apiCall("/bookings/active"),
          apiCall("/bookings/my"),
        ]);

      setRooms(roomsData.rooms || []);
      setProfessors(professorsData.professors || []);
      setActiveBookings(bookingsData.bookings || []);
      setMyBookings(myBookingsData.bookings || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomHistory = async (roomId) => {
    try {
      const response = await apiCall(`/rooms/${roomId}/history`);
      setRoomHistory(response.history || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error fetching room history:", error);
      toast.error("Failed to load room history");
    }
  };

  const handleStatusUpdate = async (status, roomNumber = null) => {
    let loadingToast;
    try {
      loadingToast = toast.loading("Updating status...");
      await apiCall("/professors/status", {
        method: "PUT",
        data: { status, roomNumber },
      });
      toast.success("Status updated successfully!", { id: loadingToast });
      
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status", { id: loadingToast });
    }
  };

  const handleEndBooking = async (bookingId) => {
    let loadingToast;
    try {
      loadingToast = toast.loading("Ending booking...");
      await apiCall(`/bookings/${bookingId}/end`, {
        method: "PUT",
      });
      toast.success("Booking ended successfully!", { id: loadingToast });
      fetchData();
    } catch (error) {
      console.error("Error ending booking:", error);
      toast.error("Failed to end booking", { id: loadingToast });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "text-green-400";
      case "In Faculty Room":
        return "text-blue-400";
      case "In Room":
        return "text-yellow-400";
      case "At Home":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getRoomsByFloor = (floor) => {
    return rooms.filter((room) => room.floor === floor);
  };

  const handleBookRoom = (room) => {
    setBookingModal({ isOpen: true, room });
  };

  const handleBookingSuccess = () => {
    
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const loadingToast = toast.loading("Logging out...");

      // Update status to "At Home" first
      await handleStatusUpdate("At Home");

      // Then perform logout
      logout();

      toast.success("Logged out successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to update status during logout");
      // Still proceed with logout even if status update fails
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1F2937",
            color: "#fff",
            border: "1px solid #374151",
          },
          duration: 3000,
        }}
      />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-white rounded flex items-center justify-center mr-3">
                <svg
                  className="h-5 w-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold">CCS/MIS Building</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Show only the first professor (or the logged-in one) */}
              {professors.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">
                    Welcome
                  </span>
                 
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {["overview", "rooms", "professors", "bookings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Book Section */}

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Total Rooms</h3>
                <p className="text-3xl font-bold text-white">{rooms.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Occupied</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {rooms.filter((room) => room.isOccupied).length}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Available</h3>
                <p className="text-3xl font-bold text-green-400">
                  {rooms.filter((room) => !room.isOccupied).length}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Active Bookings</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {activeBookings.length}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Update Your Status</h3>
              <div className="flex flex-wrap gap-3">
                {["Available", "In Faculty Room", "At Home"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
              <div className="space-y-3">
                {activeBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking._id}
                    className="flex justify-between items-center py-2 border-b border-gray-800"
                  >
                    <div>
                      <span className="font-medium">
                        Room {booking.roomNumber}
                      </span>
                      <span className="text-gray-400 ml-2">
                        - {booking.professor?.name || "Unknown"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {booking.purpose}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="space-y-6">
            {/* Floor Selector */}
            <div className="flex space-x-4">
              {[2, 3, 4].map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedFloor === floor
                      ? "bg-white text-black"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                >
                  Floor {floor}
                </button>
              ))}
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getRoomsByFloor(selectedFloor).map((room) => (
                <div
                  key={room._id}
                  className={`border rounded-lg p-6 transition-colors ${
                    room.isOccupied
                      ? "bg-red-900/20 border-red-700"
                      : "bg-gray-900 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold">
                      Room {room.roomNumber}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        room.isOccupied
                          ? "bg-red-700 text-red-100"
                          : "bg-green-700 text-green-100"
                      }`}
                    >
                      {room.isOccupied ? "Occupied" : "Available"}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-2">
                    {room.type} • Capacity: {room.capacity}
                  </p>

                  {room.currentUser && (
                    <p className="text-sm text-yellow-400">
                      {room.currentUser?.name || "Unknown"}
                    </p>
                  )}

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleBookRoom(room)}
                      disabled={room.isOccupied}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                        room.isOccupied
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-white text-black hover:bg-gray-200 active:bg-gray-300"
                      }`}
                    >
                      {room.isOccupied ? "Occupied" : "Book"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        fetchRoomHistory(room._id);
                      }}
                      className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded-md font-medium transition-colors"
                    >
                      History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "professors" && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold">Professor Status</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {professors.map((professor) => (
                <div
                  key={professor._id}
                  className="px-6 py-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium">
                      {professor.name || "Unknown"}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${getStatusColor(
                        professor.currentStatus
                      )}`}
                    >
                      {professor.currentStatus || "Unknown"}
                    </p>
                    {professor.currentRoom && (
                      <p className="text-sm text-gray-400">
                        Room {professor.currentRoom}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            {/* My Active Bookings */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold">My Active Bookings</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {myBookings
                  .filter((booking) => booking.status === "Active")
                  .map((booking) => (
                    <div
                      key={booking._id}
                      className="px-6 py-4 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium">
                          Room {booking.roomNumber}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {booking.purpose}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.startTime).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEndBooking(booking._id)}
                        className="bg-red-700 hover:bg-red-600 px-3 py-2 rounded-md text-sm transition-colors"
                      >
                        End Booking
                      </button>
                    </div>
                  ))}
                {myBookings.filter((booking) => booking.status === "Active")
                  .length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-400">
                    No active bookings
                  </div>
                )}
              </div>
            </div>

            {/* All Active Bookings */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold">All Active Bookings</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {activeBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="px-6 py-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium">Room {booking.roomNumber}</h4>
                      <p className="text-sm text-gray-400">
                        {booking.professor?.name || "Unknown"} •{" "}
                        {booking.purpose}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.startTime).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-700 text-blue-100 rounded text-xs font-medium">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, room: null })}
        room={bookingModal.room}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Room History Modal */}
      {showHistoryModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                History for Room {selectedRoom.roomNumber}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-400">Floor: {selectedRoom.floor}</p>
                <p className="text-gray-400">Type: {selectedRoom.type}</p>
                <p className="text-gray-400">
                  Capacity: {selectedRoom.capacity}
                </p>
              </div>

              <div className="divide-y divide-gray-800">
                {roomHistory.length > 0 ? (
                  roomHistory.map((booking) => (
                    <div key={booking._id} className="py-3">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {booking.professor?.name || "Unknown Professor"}
                        </span>
                        <span
                          className={`text-sm ${
                            booking.status === "Completed"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{booking.purpose}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {new Date(booking.startTime).toLocaleString()}
                        </span>
                        <span>
                          {booking.actualEndTime
                            ? new Date(booking.actualEndTime).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Duration: {formatDuration(booking.duration)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No history found for this room
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
