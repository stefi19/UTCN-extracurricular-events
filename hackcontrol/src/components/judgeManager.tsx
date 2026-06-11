import { api } from "@/trpc/api";
import { useState } from "react";
import { Button } from "@/ui";
import { Plus, Cancel } from "@/ui/icons";
import UserSearch from "./userSearch";
import { toast } from "sonner";

interface JudgeManagerProps {
  hackathonId: string;
}

const JudgeManager = ({ hackathonId }: JudgeManagerProps) => {
  const [isAddingJudge, setIsAddingJudge] = useState(false);

  // Get current judges
  const { data: judges, isLoading, refetch } = api.judge.getHackathonJudges.useQuery({
    hackathonId,
  });

  // Add judge mutation
  const addJudgeMutation = api.judge.addJudge.useMutation({
    onSuccess: (newJudge) => {
      refetch();
      toast.success(`${newJudge.user.name} added as judge`);
      setIsAddingJudge(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add judge");
    },
  });

  // Remove judge mutation
  const removeJudgeMutation = api.judge.removeJudge.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Judge removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove judge");
    },
  });

  const handleAddJudge = (user: { id: string; name: string; email: string }) => {
    addJudgeMutation.mutate({
      hackathonId,
      userId: user.id,
    });
  };

  const handleRemoveJudge = (userId: string) => {
    if (confirm("Are you sure you want to remove this judge?")) {
      removeJudgeMutation.mutate({
        hackathonId,
        userId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-800 p-6">
        <h3 className="mb-4 text-lg font-semibold">Judge Management</h3>
        <div className="text-gray-400">Loading judges...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Judge Management</h3>
        {!isAddingJudge && (
          <Button
            icon={<Plus width={16} />}
            onClick={() => setIsAddingJudge(true)}
          >
            Add Judge
          </Button>
        )}
      </div>

      {/* Add judge form */}
      {isAddingJudge && (
        <div className="mb-6 rounded-lg border border-neutral-700 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium">Invite New Judge</h4>
            <Button
              icon={<Cancel width={16} />}
              onClick={() => setIsAddingJudge(false)}
              disabled={addJudgeMutation.isLoading}
            >
              Cancel
            </Button>
          </div>
          <UserSearch
            hackathonId={hackathonId}
            onUserSelect={handleAddJudge}
            disabled={addJudgeMutation.isLoading}
          />
          {addJudgeMutation.isLoading && (
            <div className="mt-2 text-sm text-gray-400">Adding judge...</div>
          )}
        </div>
      )}

      {/* Current judges list */}
      {judges && judges.length > 0 ? (
        <div>
          <h4 className="mb-3 font-medium text-gray-300">
            Current Judges ({judges.length})
          </h4>
          <div className="space-y-3">
            {judges.map((judge) => (
              <div
                key={judge.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-neutral-700 p-3 space-y-3 sm:space-y-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {judge.user.name}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {judge.user.email}
                  </div>
                  {judge.inviter && (
                    <div className="mt-1">
                      <span className="inline-block rounded-full bg-blue-600/20 px-2 py-1 text-xs text-blue-400">
                        Invited by {judge.inviter.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Button
                    icon={<Cancel width={16} />}
                    onClick={() => handleRemoveJudge(judge.userId)}
                    disabled={removeJudgeMutation.isLoading}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400">No judges assigned yet</div>
          <div className="mt-2 text-sm text-gray-500">
            Add judges to help review submissions for this hackathon
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeManager;