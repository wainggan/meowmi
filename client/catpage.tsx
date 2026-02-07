
import { jsx } from "@parchii/jsx";
import { render_html } from "@parchii/html_dom";
import { CatpageRow } from "shared/templates.tsx"

const els = {
	search: document.getElementById('search')! as HTMLInputElement,
	list: document.getElementById('list')!,
	name_line: document.getElementById('name_line')!,
	name_edit: document.getElementById('name_edit')!,
	name_edit_input: document.getElementById('name_edit_input')!,
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
] as const;

// let selected_id = null;

const render_list = (filter_text: string = "") => {
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

	for (const f of filtered) {
		const dom = (
			<CatpageRow id={ f.id } name={ f.name } rarity={ f.rarity } breed={ f.type }/>
		);

		console.log(dom);

		render_html(dom, els.list);
	}

	if (filtered.length === 0) {
		render_html(<div>no cats found.</div>, els.list);
	}
};

els.search.addEventListener('input', () => {
	render_list(els.search.value);
});

render_list("");


