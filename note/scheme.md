# schema

draft of the database schema

- users
	- id: int (key)
	- username: string
	- password: blob
	- date_create: int
	- date_seen: int
	- tokens: int

- sessions
	- id: blob (key)
	- user_id: int (users.id)
	- cr: blob
		- unique form uuid
	- date_expire: int
		- unix time

- notifications
	- id: int (key)
	- user_id: int (users.id)
		- notification owner
	- text: text
	- date_create: int
		- unix time

- cats
	- id: int (key)
	- user_id: int (users.id)
		- who owns the cat
	- original_user_id: int (users.id)
		- the original owner of the cat
	- name: text
	- type: text
	- age: real

- trades
	- id: int (key)
	- user_id: int (users.id)
		- who is initiating a trade
	- cat_id: int (cats.id)
		- the cat being offered
	- description: text
	- date_create: int

- trade_request
	- id: int (key)
	- user_id: int (users.id)
		- who made the trade request
	- trade_id: int (trades.id)
		- what trade this is for
	- cat_id: int (cats.id)
		- the cat being offered
	- date_create: int

user 'X' creates a trade. user 'Y' creates a trade_request. if X accepts, both the trade and trade request are deleted. if X declines, only the trade request is deleted.

