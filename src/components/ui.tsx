import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { THEME as T } from "../pandeiro-ui-base/types";
export const fonts = {
  title: "InterTight_900Black",
  text: "InterTight_500Medium",
  mono: "JetBrainsMono_500Medium",
  serif: "CormorantGaramond_600SemiBold",
};
export function Label({
  children,
  orange = false,
}: {
  children: React.ReactNode;
  orange?: boolean;
}) {
  return (
    <Text
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: 0.65,
        color: orange ? T.orange : T.muted,
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  children,
  onPress,
  active,
  primary = false,
  disabled = false,
  label,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      {...(Platform.OS === "web" && active !== undefined
        ? { "aria-pressed": active }
        : {})}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.active,
        primary && styles.primary,
        { opacity: disabled ? 0.45 : pressed ? 0.65 : 1 },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { color: primary ? T.black : active ? T.orange : T.ivory },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Separator() {
  return <View style={{ height: 1, backgroundColor: T.line }} />;
}
const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  active: { borderColor: T.orange, backgroundColor: "#21150D" },
  primary: { backgroundColor: T.orange, borderColor: T.orange },
  buttonText: { fontSize: 12, fontFamily: fonts.mono },
});
