/*
page used for the front page.
*/

import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

const index: router.Middleware<{}, 'GET', never> = async ctx => {
	const dom = (
		<template.Base title="index">
<nav>

  <button class="nav-btn">Home</button>

  <div class="nav-group">
    <button class="nav-btn">News</button>
    <div class="dropdown">
      <button>Build Info</button>
      <button>Events</button>
      <button>Updates</button>
    </div>
  </div>

  <div class="nav-group">
    <button class="nav-btn">CDS</button>
    <div class="dropdown">
      <button>Adoption</button>
      <button>Gacha Pulls</button>
      <button>Cat Shop</button>
    </div>
  </div>

  <div class="nav-group">
    <button class="nav-btn">Trades</button>
    <div class="dropdown">
      <button>Open Trades</button>
      <button>Requests</button>
      <button>Past Trades</button>
    </div>
  </div>

  <div class="nav-group">
    <button class="nav-btn">Bag</button>
    <div class="dropdown">
      <button>Accessories</button>
      <button>Brushes</button>
      <button>Food</button>
      <button>Toys</button>
    </div>
  </div>

  <div class="nav-group">
    <button class="nav-btn">Cats</button>
    <div class="dropdown">
      <button>Owned Cats</button>
      <button>Care</button>
      <button>Feeding</button>
      <button>Play</button>
    </div>
  </div>

  <div class="spacer"></div>

  <a href="/login" class="nav-btn">Login</a>
  <button class="nav-btn" onclick="toggleMenu()">☰</button>

</nav>

<main>
  <div class="hero">
    NEWS TICKER ART
</div>

</main>

<div class="carousel-wrap">
  <div class="carousel">
    <div class="banner">Current Banner Cats</div>
    <div class="banner">Limited Pull Shop</div>
    <div class="banner">Event Rewards</div>
  </div>
</div>

<div id="menu" class="side-menu">
  <div class="menu-header">
    <h3>Menu</h3>
    <button class="close-btn" onclick="toggleMenu()" aria-label="Close menu">&gt</button>
  </div>

  <div class="menu-items">
    <button>Account</button>
    <button>Settings</button>
    <button>Contact Us</button>
    <button>Log Out</button>
  </div>
</div>

<script>
{
  `
  function toggleMenu() {
    document.getElementById("menu").classList.toggle("open");
  }
  `
}
</script>

		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

export default {
	index,
};

