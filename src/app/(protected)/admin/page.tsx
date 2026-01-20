"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { formatRelativeDate, formatDateTime } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  displayName: string | null;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: "weight_logged" | "progress_viewed";
  metadata: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchActivity();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchActivity(selectedUserId);
    } else {
      fetchActivity();
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivity = async (userId?: string) => {
    try {
      const url = userId
        ? `/api/admin/activity?userId=${userId}`
        : "/api/admin/activity";
      const res = await fetch(url);
      const data = await res.json();
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  };

  const getUserById = (id: string) => users.find((u) => u.id === id);

  const formatAction = (action: string) => {
    switch (action) {
      case "weight_logged":
        return "Logged weight";
      case "progress_viewed":
        return "Viewed progress";
      default:
        return action;
    }
  };

  const parseMetadata = (metadata: string | null) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        if (selectedUserId === userToDelete.id) {
          setSelectedUserId(null);
        }
        fetchActivity();
      } else {
        const data = await res.json();
        console.error("Failed to delete user:", data.error);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-bae-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-bae-800">Admin Dashboard</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedUserId(null)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedUserId === null
                    ? "bg-bae-100 border-bae-300"
                    : "hover:bg-bae-50"
                } border`}
              >
                <span className="font-medium">All Users</span>
              </button>
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                    selectedUserId === user.id
                      ? "bg-bae-100 border-bae-300"
                      : "hover:bg-bae-50"
                  } border`}
                >
                  <button
                    onClick={() => setSelectedUserId(user.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-sm text-bae-500">
                      @{user.username} · Joined{" "}
                      {formatRelativeDate(new Date(user.createdAt))}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToDelete(user);
                    }}
                    className="text-bae-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                    aria-label={`Delete user ${user.username}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>
              Activity Log
              {selectedUserId && (
                <span className="font-normal text-bae-500">
                  {" "}
                  - {getUserById(selectedUserId)?.displayName ||
                    getUserById(selectedUserId)?.username}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-bae-500 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {activityLogs.map((log) => {
                  const user = getUserById(log.userId);
                  const metadata = parseMetadata(log.metadata);
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-bae-100 hover:border-bae-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {formatAction(log.action)}
                          </span>
                          {metadata && metadata.weight && (
                            <span className="text-bae-600 ml-2">
                              {metadata.weight} {metadata.unit}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-bae-500">
                          {formatDateTime(new Date(log.createdAt))}
                        </span>
                      </div>
                      {!selectedUserId && user && (
                        <div className="text-sm text-bae-500 mt-1">
                          by {user.displayName || user.username}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={userToDelete !== null}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.displayName || userToDelete?.username}? This will permanently remove their account and all associated data (weights, achievements, activity logs).`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}
