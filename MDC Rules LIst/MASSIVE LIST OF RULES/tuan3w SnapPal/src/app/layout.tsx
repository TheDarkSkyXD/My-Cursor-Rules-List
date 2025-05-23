import { Fredoka, Quicksand } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fredoka = Fredoka({
	subsets: ["latin"],
	variable: "--font-fredoka",
});

const quicksand = Quicksand({
	subsets: ["latin"],
	variable: "--font-quicksand",
});

export const metadata = {
	title: "SnapPal - Your Friendly Photo Sidekick",
	description: "Fun photo editor with AI magic",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${fredoka.variable} ${quicksand.variable}`}>
				<main className="min-h-screen font-quicksand">{children}</main>
				<Toaster position="top-center" />
			</body>
		</html>
	);
}
