-- Address of the shop: edited in Negocio > General and shown in the website footer.
alter table public.organizations
  add column if not exists address text;

alter table public.organizations
  drop constraint if exists organizations_address_length;
alter table public.organizations
  add constraint organizations_address_length check (address is null or char_length(address) <= 200);
