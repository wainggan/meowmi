/*
various helpful jsx 'template' components
*/

import { jsx, fragment } from "@parchii/jsx";

export const Base = (input: { title: string }, children: unknown[]) => {
	return (
		<>
			{ "<!doctype html>" }
			<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1.0" />
				<link rel="stylesheet" href="/static/style.css"/>
				<title>{ input.title }</title>
			</head>
			<body>
				<Navigation/>
				{ ...children }
			</body>
			</html>
		</>
	);
};

export const NavigationGroup = (input: { name: string }, children: unknown[]) => {
	return (
		<div class="nav-group">
			<button class="nav-btn">{ input.name }</button>
			<div class="dropdown">
				{ ...children }
			</div>
		</div>
	);
};

export const Navigation = (input: {}) => {
	input;
	return (
		<>
			<nav>
				<button class="nav-btn">Home</button>

				<NavigationGroup name="News">
					<button>Build Info</button>
					<button>Events</button>
					<button>Updates</button>
				</NavigationGroup>

				<NavigationGroup name="CDS">
					<button>Adoption</button>
					<button>Gacha Pulls</button>
					<button>Cat Shop</button>
				</NavigationGroup>

				<NavigationGroup name="Trades">
					<button>Open Trades</button>
					<button>Requests</button>
					<button>Past Trades</button>
				</NavigationGroup>

				<NavigationGroup name="Bag">
					<button>Accessories</button>
					<button>Brushes</button>
					<button>Food</button>
					<button>Toys</button>
				</NavigationGroup>

				<NavigationGroup name="Cats">
					<button>Owned Cats</button>
					<button>Care</button>
					<button>Feeding</button>
					<button>Play</button>
				</NavigationGroup>

				<div class="spacer"></div>

				<a href="/login" class="nav-btn">Login</a>
				<button class="nav-btn" onclick="toggleMenu()">☰</button>

				<script>
				{
				`
				function toggleMenu() {
					document.getElementById("menu").classList.toggle("open");
				}
				`
				}
				</script>
			</nav>

			<div id="menu" class="side-menu">
				<div class="menu-header">
					<h3>Menu</h3>
					<button class="close-btn" onclick="toggleMenu()" aria-label="Close menu">&gt;</button>
				</div>

				<div class="menu-items">
					<button>Account</button>
					<button>Settings</button>
					<button>Contact Us</button>
					<button>Log Out</button>
				</div>
			</div>
		</>
	);
};

export const Flash = (input: { message: string | null }) => {
	const out = input.message === null
		? null
		: (
			<div class="flash">
				{ input.message }
			</div>
		);
	return (
		<>
			{ out }
		</>
	);
};

