output=version.json
file_count=`ls *.zip | wc -l`
if [ $file_count -gt 3 ]
then
 rm "$(ls *.zip -t | tail -1)"
fi

array=()
for entry in `ls -tr *.zip`
do
  # Add some attritubes here
  checkSum=`md5sum ${entry} | awk '{print $1}'`
  version=${entry::-4}
  modifyTime=`echo $(($(date -r $entry +%s%N)/1000000))`
  array+=("{\"file_name\": \"$entry\", \"check_sum\": \"$checkSum\", \"version\": \"$version\", \"timestamp\": \"$modifyTime\"}")
done

lastCheck=0
arrayLen=`echo ${#array[@]}`
echo "[" > $output
for item in "${array[@]}"
do
   
   if [ $lastCheck -lt $(($arrayLen-1))  ]
     then
       echo ${item}"," >> $output
   else
       echo ${item} >> $output
   fi
   ((lastCheck++))
done

echo "]" >> $output
