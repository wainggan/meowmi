"use strict";

import { jsx } from "@parchii/jsx";
import { render_html } from "@parchii/html_dom";
import { CatpageRow } from "shared/templates.tsx";
import { rarity } from "shared/types.ts";

const els = {
	// the search input
	search: document.getElementById('search'),
	search_button: document.getElementById('search_button'),
	// left side list of cats
	list: document.getElementById('list'),
	// right side header, when not in edit mode
	name_line: document.getElementById('name_line'),
	name_line_cat: document.getElementById('name_line_cat'),
	name_line_edit: document.getElementById('name_line_edit'),
	// right side header, when in edit mode
	name_edit: document.getElementById('name_edit'),
	name_edit_input: document.getElementById('name_edit_input'),
	name_edit_save: document.getElementById('name_edit_save'),
	name_edit_cancel: document.getElementById('name_edit_cancel'),

	meta_line: document.getElementById('meta_line'),
	meta_line_type: document.getElementById('meta_line_type'),
	meta_line_id: document.getElementById('meta_line_id'),
	
	rarity_pill: document.getElementById('rarity_pill'),
	
	value_name: document.getElementById('value_name'),
	value_type: document.getElementById('value_type'),
	
	hint: document.getElementById('hint'),
};

let cache_data;
let cache_select;

const request = async () => {
	const url = new URL(globalThis.location.origin + '/api/cat/list');

	url.searchParams.set('query', els.search.value);

	const data = await fetch(url.href, {
			method: 'GET',
			credentials: 'same-origin',
		})
		.then(r => r.json())
		.catch(_r => {
			throw new Error(`unknown`);
		});

	if (data.status === 'err') {
		throw new Error(`unknown`);
	}

	return data.list;
};

const render_list = () => {
	els.list.innerHTML = ``;

	for (const point of cache_data) {
		const catinst = point.inst;
		const catdef = point.def;

		const dom = (
			<CatpageRow id={ catinst.id } name={ catinst.name } rarity={ rarity[catdef.rarity] } breed={ catdef.name }/>
		);

		const row = render_html(dom, els.list);
		
		if (row === null) {
			continue; // ???
		}

		if (cache_select !== undefined && cache_select[1] === catinst) {
			cache_select[0] = row;
			row.classList.add('active');
		}

		row.addEventListener('click', () => select_cat(row, catinst, catdef));
	}

	if (cache_data.length === 0) {
		render_html(<div>no cats found.</div>, els.list);
	}
};

const run = () => {
	request()
		.then(r => {
			cache_data = r;
			render_list();
		});
};

const select_cat = (element, catinst, catdef) => {
	if (cache_select !== undefined) {
		cache_select[0].classList.remove('active');
	}
	cache_select = [element, catinst];

	element.classList.add('active');

	nickname_editor_close();

	els.hint.setAttribute('hidden', '');

	els.name_line_cat.textContent = catinst.name;
	els.rarity_pill.textContent = rarity[catdef.rarity];

	els.meta_line_id.textContent = catinst.id;
	els.meta_line_type.textContent = catdef.name;

	els.value_name.textContent = catinst.name;
	// els.value_nick.textContent = cat.nickname || "—";
	els.value_type.textContent = catdef.name;
};

const nickname_editor_open = () => {
	if (cache_select === undefined) {
		return;
	}

	const cat = cache_select[1];

	els.name_line.hidden = true;

	els.name_edit.hidden = false;
	els.name_edit_input.value = cat.name;
	els.name_edit_input.focus();
	els.name_edit_input.select();
};

const nickname_editor_close = () => {
	els.name_edit.hidden = true;
	els.name_line.hidden = false;
};

const nickname_save = () => {
	if (cache_select === undefined) {
		return;
	}

	const cat = cache_select[1];

	const nickname = els.name_edit_input.value.trim();
	cat.name = nickname;

	els.name_line_cat.textContent = cat.name;
	els.value_name.textContent = cat.name;
	// els.value_nick.textContent = cat.nickname || "—";

	{
		const url = new URL(globalThis.location.origin + '/api/cat/update');

		const form = new URLSearchParams();
		form.set('id', cat.id);
		form.set('name', nickname);

		fetch(url.href, {
			method: 'POST',
			body: form,
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		})
		.then(r => r.json())
		.catch(_r => {
			throw new Error(`unknown`);
		});
	}

	render_list();

	nickname_editor_close();
};

// theyre listening they are in my walls
els.search.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		run();
	}
});

els.search_button.addEventListener('click', () => {
	run();
});

els.name_line_edit.addEventListener('click', () => {
	nickname_editor_open();
});

els.name_edit_cancel.addEventListener('click', () => {
	nickname_editor_close();
});

els.name_edit_save.addEventListener('click', () => {
	nickname_save();
});

els.name_edit_input.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		nickname_save();
	}
	if (e.key === 'Escape') {
		nickname_editor_close();
	}
});

// render_list("");

run();

