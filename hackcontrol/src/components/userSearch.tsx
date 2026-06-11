import { api } from "@/trpc/api";
import { useState, useEffect } from "react";
import { inputStyles } from "@/ui/input";
import { Button } from "@/ui";
import { Plus } from "@/ui/icons";
import clsx from "clsx";

interface UserSearchProps {
  hackathonId: string;
  onUserSelect: (user: { id: string; name: string; email: string }) => void;
  disabled?: boolean;
}

const UserSearch = ({ hackathonId, onUserSelect, disabled }: UserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: users, isLoading } = api.judge.searchUsers.useQuery(
    {
      query: searchQuery,
      hackathonId,
    },
    {
      enabled: searchQuery.length >= 2, // Only search when query is at least 2 characters
    }
  );

  const handleUserSelect = (user: { id: string; name: string | null; email: string | null }) => {
    onUserSelect({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email || "",
    });
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    setIsDropdownOpen(searchQuery.length >= 2 && !isLoading);
  }, [searchQuery, isLoading]);

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name or email..."
          className={clsx(inputStyles, "flex-1")}
          disabled={disabled}
        />
      </div>

      {/* Dropdown with search results */}
      {isDropdownOpen && users && users.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-neutral-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {user.name || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
                <Plus width={16} className="text-gray-400 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isDropdownOpen && users && users.length === 0 && searchQuery.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 shadow-lg">
          <div className="text-sm text-gray-400">No users found</div>
        </div>
      )}

      {/* Loading state */}
      {searchQuery.length >= 2 && isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 shadow-lg">
          <div className="text-sm text-gray-400">Searching...</div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;