import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>sier-kse</CardTitle>
        <CardDescription>Iniciá sesión para acceder al panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
