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
				{ ...children }
			</body>
			</html>
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

