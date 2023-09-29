select
fromp.name as fromname,
top.name as toname,
pr."departTime",
ST_Distance(fromp.coords, 'SRID=3857;POINT(-83.721222 42.295293)') +
ST_Distance(top.coords ,'SRID=3857;POINT(-83.3487 42.225809)') as combined_score
from "PoolRequest" pr
inner join "Place" fromp ON fromp."placeId" = pr."fromId"
inner join "Place" top ON top."placeId" = pr."toId"
order by ABS(EXTRACT(epoch FROM pr."departTime" - '2023-04-28 21:00:00'::timestamp)), combined_score asc
