/*
various helpful jsx 'template' components
*/

import { jsx, fragment } from "@parchii/jsx.ts";
import { User } from "../db/db.types.ts";
import { UserContext } from "../db/db.util.ts";
// import * as db_util from "../db/db.util.ts";

export const Base = (input: { title: string, user_ctx: UserContext | null }, children: unknown[]) => {
	return (
		<>
			{ "<!doctype html>" }
			<html lang="en" data-theme={ input.user_ctx?.settings['theme'] }>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1.0" />
				<link rel="stylesheet" href="/static/style.css"/>
				<title>{ input.title }</title>
			</head>
			<body>
				<div class="app">
					<Navigation user={ input.user_ctx?.user ?? null }/>
					<div class="app--content">
						{ ...children }
					</div>
				</div>
			</body>
			</html>
		</>
	);
};

export const NavigationGroup = (input: { name: string }, children: unknown[]) => {
	return (
		<div class="app--nav--group">
			<button class="button">{ input.name }</button>
			<div class="app--nav--group--dropdown">
				{ ...children }
			</div>
		</div>
	);
};

export const Navigation = (input: { user: User | null }) => {
	return (
		<>
			<nav class="app--nav">
				<a href="/" class="button">Home</a>

				<NavigationGroup name="News">
					<a href="#" class="button">Build Info</a>
					<a href="#" class="button">Events</a>
					<a href="#" class="button">Updates</a>
				</NavigationGroup>

				<NavigationGroup name="CDS">
					<a href="#" class="button">Adoption</a>
					<a href="/gacha" class="button">Gacha Pulls</a>
					<a href="#" class="button">Cat Shop</a>
				</NavigationGroup>

				<NavigationGroup name="Trades">
					<a href="#" class="button">Open Trades</a>
					<a href="#" class="button">Requests</a>
					<a href="#" class="button">Past Trades</a>
				</NavigationGroup>

				<NavigationGroup name="Bag">
					<a href="#" class="button">Accessories</a>
					<a href="#" class="button">Brushes</a>
					<a href="#" class="button">Food</a>
					<a href="#" class="button">Toys</a>
				</NavigationGroup>

				<NavigationGroup name="Cats">
					<a href="/cat" class="button">Owned Cats</a>
					<a href="#" class="button">Care</a>
					<a href="#" class="button">Feeding</a>
					<a href="#" class="button">Play</a>
				</NavigationGroup>

				<a href="/settings" class="button">Settings</a>

				<div class="app--nav--spacer"></div>

				{
					input.user === null
					? <a href="/login" class="button">Login</a>
					: <a href="/logout" class="button">Logout</a>
				}
				
				<button class="button" onclick="toggleMenu()">☰</button>
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

