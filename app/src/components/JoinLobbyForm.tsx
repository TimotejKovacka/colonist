import { type Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const schema = Type.Object({
  shareCode: Type.String({
    minLength: 6,
    maxLength: 6,
    pattern: REGEXP_ONLY_DIGITS_AND_CHARS,
  }),
});
const typecheck = TypeCompiler.Compile(schema);
type FormValues = Static<typeof schema>;

export const JoinLobbyForm: React.FC = () => {
  const { lobbyStore } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: typeboxResolver(typecheck),
    defaultValues: {
      shareCode: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await lobbyStore.joinLobby(data.shareCode);
      // You might want to navigate to the lobby page here
      toast({
        title: "Successfully joined lobby",
      });
      navigate(`/lobby/${data.shareCode}`);
    } catch (error) {
      // Handle error (maybe show a toast notification)
      form.setError("shareCode", {
        type: "manual",
        message: "Invalid or expired share code",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="shareCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game share-code</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  {...field}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Please enter the game share-code sent to you.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Join</Button>
      </form>
    </Form>
  );
};
