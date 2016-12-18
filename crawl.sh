start_date=2011-06-24
d=$start_date
current_date=$(date -I)

# Get new CID and EI from https://www.google.com/finance
cid="4592563"
ei="y-xVWLGBJImv0ASYibfABg"

while [ "$d" != "$current_date" ]; do 
  date_i=$(date -d "$d" +%s) 
  date_i_next=$(date -d "$d + 1 days" +%s) 

  echo "Start >> ${d} >> ${date_i}000"
  echo "https://www.google.com/finance/kd?output=json&keydevs=1&st=${date_i}000&et=${date_i_next}000&recnews=0&cid=${cid}&ei=${ei}" 
  curl "https://www.google.com/finance/kd?output=json&keydevs=1&st=${date_i}000&et=${date_i_next}000&recnews=0&cid=${cid}&ei=${ei}" \
  	-H 'Referer: https://www.google.com/finance?q=NYSE:P' \
  	-H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36' \
  	--compressed | echo "module.exports = $(cat -)" > output/$d.js
  sleep 1
  d=$(date -I -d "$d + 1 days")
done