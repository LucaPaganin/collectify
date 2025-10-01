imgs=$(docker images -f "dangling=true" | egrep "collectify" | awk '{print $3}')
vols=$(docker volume ls -f "dangling=true" | egrep "collectify" | awk '{print $2}')
[ -n "$imgs" ] && docker rmi -f $imgs
[ -n "$vols" ] && docker volume rm $vols
docker system prune -f --volumes