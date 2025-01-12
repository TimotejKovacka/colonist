import {
  querifyResourceIds,
  type ResourceBody,
  type ResourceIds,
  type ResourceIdsModifiedAt,
  type SessionSettingsResource,
  sessionSettingsResource,
} from "@pilgrim/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { lobbyApi } from "@/api/lobby-api";
import type { AxiosApiError } from "@/api/base-api";
import { useResourceQuery } from "@/hooks/use-resource-query";

const OwnerLobbySettings: React.FC<{
  className?: string;
  ids: ResourceIds<SessionSettingsResource>;
}> = ({ className, ids }) => {
  const queryClient = useQueryClient();
  const {
    data: settings,
    isLoading,
    isFetching,
    error,
  } = useResourceQuery(sessionSettingsResource, ids);

  const { mutate } = useMutation<
    ResourceIdsModifiedAt<SessionSettingsResource>,
    AxiosApiError,
    ResourceBody<SessionSettingsResource>
  >({
    mutationKey: querifyResourceIds(sessionSettingsResource, ids),
    mutationFn: (patch) => lobbyApi.patchSettings(ids, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: querifyResourceIds(sessionSettingsResource, ids),
      });
    },
  });

  if (isLoading || isFetching) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">Error: {error?.message}</div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Game Speed</label>
          <Select
            value={settings.gameSpeed.toString()}
            onValueChange={(v) => {
              mutate({
                gameSpeed: Number.parseInt(v),
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select game speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Slow</SelectItem>
              <SelectItem value="1">Normal</SelectItem>
              <SelectItem value="2">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export { OwnerLobbySettings };
