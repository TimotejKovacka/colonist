import { type Static, Type } from "@sinclair/typebox";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
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
import { useLobbyMutations } from "@/hooks/use-lobby";
import type { SessionId } from "@colonist/api-contracts";

const schema = Type.Object({
  sessionId: Type.String({
    minLength: 6,
    maxLength: 6,
    pattern: REGEXP_ONLY_DIGITS_AND_CHARS,
    default: "",
  }),
});

type FormValues = Static<typeof schema>;
// const compiledSchema = TypeCompiler.Compile(schema);

export const JoinLobbyForm: React.FC = () => {
  const { joinLobby, isPending } = useLobbyMutations({ withNavigation: true });

  const form = useForm<FormValues>({
    resolver: typeboxResolver(schema),
    defaultValues: {
      sessionId: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await joinLobby({
        sessionId: data.sessionId as SessionId,
      });
    } catch (error) {
      // Handle error (maybe show a toast notification)
      form.setError("sessionId", {
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
          name="sessionId"
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

        <Button type="submit">{isPending ? "Joining..." : "Join"}</Button>
      </form>
    </Form>
  );
};
