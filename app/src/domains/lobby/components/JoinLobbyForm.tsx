import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { LobbyModel } from "../model";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
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

const schema = Type.Object({
  pin: Type.String({
    minLength: 6,
    maxLength: 6,
    pattern: REGEXP_ONLY_DIGITS_AND_CHARS,
  }),
});
const typecheck = TypeCompiler.Compile(schema);
type FormValues = Static<typeof schema>;

export const JoinLobbyForm: React.FC<{ lobbyModel: LobbyModel }> = ({
  lobbyModel,
}) => {
  const form = useForm<FormValues>({
    resolver: typeboxResolver(typecheck),
    defaultValues: {
      pin: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    const resp = await api.get("/lobby/join", {
      data,
    });

    console.log("submit response", resp.data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="pin"
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
