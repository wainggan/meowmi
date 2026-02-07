import { jsx } from "@parchii/jsx";
import { render_html } from "@parchii/html_dom";
import { CatpageRow } from "shared/templates.tsx"

const els = {
	// the search input
	search: document.getElementById('search')! as HTMLInputElement,
	// left side list of cats
	list: document.getElementById('list')!,
	// right side header, when not in edit mode
	name_line: document.getElementById('name_line')!,
	name_line_cat: document.getElementById('name_line_cat')!,
	name_line_edit: document.getElementById('name_line_edit')!,
	// right side header, when in edit mode
	name_edit: document.getElementById('name_edit')!,
	name_edit_input: document.getElementById('name_edit_input')! as HTMLInputElement,
	name_edit_save: document.getElementById('name_edit_save')!,
	name_edit_cancel: document.getElementById('name_edit_cancel')!,

	meta_line: document.getElementById('meta_line')!,
	meta_line_type: document.getElementById('meta_line_type')!,
	meta_line_id: document.getElementById('meta_line_id')!,
	
	rarity_pill: document.getElementById('rarity_pill')!,
	
	value_name: document.getElementById('value_name')!,
	value_nick: document.getElementById('value_nick')!,
	value_value: document.getElementById('value_value')!,
	
	hint: document.getElementById('hint')!,
};

const cats = [
	{ id: "CAT-001", name: "Mittens", type: "Tabby", rarity: "SSSR", nickname: "" },
	{ id: "CAT-002", name: "Saffron", type: "Calico", rarity: "SSSSR", nickname: "" },
	{ id: "CAT-003", name: "Nova", type: "Galaxy", rarity: "SSSSSR", nickname: "" },
	{ id: "CAT-004", name: "Biscuit", type: "British Shorthair", rarity: "SSR", nickname: "" },
	{ id: "CAT-005", name: "Luna", type: "Shadow", rarity: "SSSSSSR", nickname: "" },
	{ id: "CAT-006", name: "Pip", type: "Orange", rarity: "SSSSR", nickname: "" },
];

const byId = new Map(cats.map(c => [c.id as string, c]));

let selected_id: string | null = null;

const render_list = (filter_text: string = ""): void => {
	const q = filter_text.trim().toLowerCase();
	const filtered = cats.filter(c => {
		if (!q) {
			return true;
		}
		return c.name.toLowerCase().includes(q)
			|| c.nickname.toLowerCase().includes(q)
			|| c.type.toLowerCase().includes(q)
			|| c.rarity.toLowerCase().includes(q)
			|| c.id.toLowerCase().includes(q);
	});

	els.list.innerHTML = ``;

	for (const cat of filtered) {
		const dom = (
			<CatpageRow id={ cat.id } name={ cat.nickname || cat.name } rarity={ cat.rarity } breed={ cat.type }/>
		);

		console.log(dom);

		const row = render_html(dom, els.list);
		
		if (row === null) {
			continue; // ???
		}

		row.addEventListener('click', () => select_cat(cat.id));
	}

	if (filtered.length === 0) {
		render_html(<div>no cats found.</div>, els.list);
	}
};

const select_cat = (id: string): void => {
	selected_id = id;

	const cat = byId.get(id);
	if (cat === undefined) {
		return;
	}

	nickname_editor_close();

	els.hint.setAttribute('hidden', '');

	els.name_line_cat.textContent = cat.nickname ? cat.nickname : cat.name;
	els.rarity_pill.textContent = cat.rarity;

	els.meta_line_id.textContent = cat.id || "—";
	els.meta_line_type.textContent = cat.type || "—";

	els.value_name.textContent = cat.name || "—";
	els.value_nick.textContent = cat.nickname || "—";
	els.value_value.textContent = cat.type || "—";

	render_list(els.search.value);
};

const nickname_editor_open = (): void => {
	if (selected_id === null) {
		return;
	}

	const cat = byId.get(selected_id);
	if (cat === undefined) {
		return;
	}

	els.name_line.hidden = true;

	els.name_edit.hidden = false;
	els.name_edit_input.value = cat.nickname || "";
	els.name_edit_input.focus();
	els.name_edit_input.select();
};

const nickname_editor_close = (): void => {
	els.name_edit.hidden = true;
	els.name_line.hidden = false;
};

const nickname_save = (): void => {
	if (selected_id === null) {
		return;
	}

	const cat = byId.get(selected_id);
	if (cat === undefined) {
		return;
	}

	const nickname = els.name_edit_input.value.trim();
	cat.nickname = nickname;

	els.name_line_cat.textContent = cat.nickname ? cat.nickname : cat.name;
	els.value_name.textContent = cat.name || "—";
	els.value_nick.textContent = cat.nickname || "—";

	render_list(els.search.value);

	nickname_editor_close();
};

els.search.addEventListener('input', () => {
	render_list(els.search.value);
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

render_list("");


