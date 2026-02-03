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
				<a href="/" class="nav-btn">Home</a>

				<NavigationGroup name="News">
					<a href="#" class="nav-btn">Build Info</a>
					<a href="#" class="nav-btn">Events</a>
					<a href="#" class="nav-btn">Updates</a>
				</NavigationGroup>

				<NavigationGroup name="CDS">
					<a href="#" class="nav-btn">Adoption</a>
					<a href="/gacha" class="nav-btn">Gacha Pulls</a>
					<a href="#" class="nav-btn">Cat Shop</a>
				</NavigationGroup>

				<NavigationGroup name="Trades">
					<a href="#" class="nav-btn">Open Trades</a>
					<a href="#" class="nav-btn">Requests</a>
					<a href="#" class="nav-btn">Past Trades</a>
				</NavigationGroup>

				<NavigationGroup name="Bag">
					<a href="#" class="nav-btn">Accessories</a>
					<a href="#" class="nav-btn">Brushes</a>
					<a href="#" class="nav-btn">Food</a>
					<a href="#" class="nav-btn">Toys</a>
				</NavigationGroup>

				<NavigationGroup name="Cats">
					<a href="#" class="nav-btn">Owned Cats</a>
					<a href="#" class="nav-btn">Care</a>
					<a href="#" class="nav-btn">Feeding</a>
					<a href="#" class="nav-btn">Play</a>
				</NavigationGroup>

				<div class="spacer"></div>

				<a href="/login" class="nav-btn">Login</a>
				<button class="nav-btn" onclick="toggleMenu()">☰</button>
			</nav>

			<div id="menu" class="side-menu">
				<div class="menu-header">
					<h3>Menu</h3>
					<button class="close-btn" onclick="toggleMenu()" aria-label="Close menu">&gt;</button>
				</div>

				<div class="menu-items">
					<a href="#">Account</a>
					<a href="#">Settings</a>
					<a href="#">Contact Us</a>
					<a href="#">Log Out</a>
				</div>
			</div>

			<script defer>
			{
			`
			function toggleMenu() {
				document.getElementById("menu").classList.toggle("open");
			}
			`
			}
			</script>
		</>
	);
};

export const Flash = (input: { flash: { message: string, mood: 'ok' | 'err' } | null }) => {
	let out;
	
	if (input.flash === null) {
		out = null;
	}
	else {
		const classes = `flash flash-${input.flash.mood}`;
		out = (
			<div class={ classes }>
				{ input.flash.message }
			</div>
		);
	}

	return (
		<>
			{ out }
		</>
	);
};

