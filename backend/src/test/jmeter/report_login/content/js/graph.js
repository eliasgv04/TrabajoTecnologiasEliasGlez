/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 146.0, "minX": 0.0, "maxY": 1362.0, "series": [{"data": [[0.0, 146.0], [0.1, 146.0], [0.2, 147.0], [0.3, 147.0], [0.4, 148.0], [0.5, 149.0], [0.6, 149.0], [0.7, 150.0], [0.8, 150.0], [0.9, 150.0], [1.0, 150.0], [1.1, 150.0], [1.2, 150.0], [1.3, 151.0], [1.4, 151.0], [1.5, 151.0], [1.6, 151.0], [1.7, 151.0], [1.8, 151.0], [1.9, 151.0], [2.0, 152.0], [2.1, 152.0], [2.2, 152.0], [2.3, 153.0], [2.4, 153.0], [2.5, 153.0], [2.6, 153.0], [2.7, 154.0], [2.8, 154.0], [2.9, 154.0], [3.0, 154.0], [3.1, 154.0], [3.2, 155.0], [3.3, 155.0], [3.4, 155.0], [3.5, 155.0], [3.6, 155.0], [3.7, 155.0], [3.8, 155.0], [3.9, 156.0], [4.0, 156.0], [4.1, 156.0], [4.2, 156.0], [4.3, 156.0], [4.4, 156.0], [4.5, 157.0], [4.6, 157.0], [4.7, 157.0], [4.8, 157.0], [4.9, 157.0], [5.0, 157.0], [5.1, 157.0], [5.2, 158.0], [5.3, 158.0], [5.4, 158.0], [5.5, 158.0], [5.6, 158.0], [5.7, 158.0], [5.8, 158.0], [5.9, 158.0], [6.0, 158.0], [6.1, 159.0], [6.2, 159.0], [6.3, 159.0], [6.4, 159.0], [6.5, 159.0], [6.6, 159.0], [6.7, 159.0], [6.8, 159.0], [6.9, 159.0], [7.0, 159.0], [7.1, 159.0], [7.2, 160.0], [7.3, 160.0], [7.4, 160.0], [7.5, 160.0], [7.6, 161.0], [7.7, 161.0], [7.8, 161.0], [7.9, 161.0], [8.0, 161.0], [8.1, 161.0], [8.2, 161.0], [8.3, 161.0], [8.4, 162.0], [8.5, 162.0], [8.6, 162.0], [8.7, 162.0], [8.8, 162.0], [8.9, 162.0], [9.0, 162.0], [9.1, 162.0], [9.2, 162.0], [9.3, 162.0], [9.4, 162.0], [9.5, 162.0], [9.6, 163.0], [9.7, 163.0], [9.8, 163.0], [9.9, 163.0], [10.0, 163.0], [10.1, 163.0], [10.2, 163.0], [10.3, 163.0], [10.4, 163.0], [10.5, 163.0], [10.6, 163.0], [10.7, 163.0], [10.8, 163.0], [10.9, 163.0], [11.0, 163.0], [11.1, 163.0], [11.2, 163.0], [11.3, 163.0], [11.4, 163.0], [11.5, 163.0], [11.6, 164.0], [11.7, 164.0], [11.8, 164.0], [11.9, 164.0], [12.0, 164.0], [12.1, 164.0], [12.2, 164.0], [12.3, 164.0], [12.4, 164.0], [12.5, 164.0], [12.6, 164.0], [12.7, 164.0], [12.8, 164.0], [12.9, 164.0], [13.0, 165.0], [13.1, 165.0], [13.2, 165.0], [13.3, 165.0], [13.4, 165.0], [13.5, 165.0], [13.6, 165.0], [13.7, 166.0], [13.8, 166.0], [13.9, 166.0], [14.0, 166.0], [14.1, 166.0], [14.2, 166.0], [14.3, 166.0], [14.4, 166.0], [14.5, 166.0], [14.6, 166.0], [14.7, 166.0], [14.8, 166.0], [14.9, 166.0], [15.0, 166.0], [15.1, 166.0], [15.2, 166.0], [15.3, 166.0], [15.4, 166.0], [15.5, 166.0], [15.6, 166.0], [15.7, 167.0], [15.8, 167.0], [15.9, 167.0], [16.0, 167.0], [16.1, 167.0], [16.2, 167.0], [16.3, 167.0], [16.4, 167.0], [16.5, 167.0], [16.6, 167.0], [16.7, 167.0], [16.8, 167.0], [16.9, 167.0], [17.0, 167.0], [17.1, 167.0], [17.2, 167.0], [17.3, 167.0], [17.4, 168.0], [17.5, 168.0], [17.6, 168.0], [17.7, 168.0], [17.8, 168.0], [17.9, 168.0], [18.0, 168.0], [18.1, 168.0], [18.2, 168.0], [18.3, 168.0], [18.4, 168.0], [18.5, 168.0], [18.6, 168.0], [18.7, 168.0], [18.8, 168.0], [18.9, 168.0], [19.0, 168.0], [19.1, 168.0], [19.2, 168.0], [19.3, 168.0], [19.4, 168.0], [19.5, 168.0], [19.6, 169.0], [19.7, 169.0], [19.8, 169.0], [19.9, 169.0], [20.0, 169.0], [20.1, 169.0], [20.2, 169.0], [20.3, 169.0], [20.4, 169.0], [20.5, 169.0], [20.6, 169.0], [20.7, 169.0], [20.8, 169.0], [20.9, 169.0], [21.0, 169.0], [21.1, 169.0], [21.2, 169.0], [21.3, 169.0], [21.4, 169.0], [21.5, 170.0], [21.6, 170.0], [21.7, 170.0], [21.8, 170.0], [21.9, 170.0], [22.0, 170.0], [22.1, 170.0], [22.2, 170.0], [22.3, 170.0], [22.4, 170.0], [22.5, 170.0], [22.6, 170.0], [22.7, 170.0], [22.8, 170.0], [22.9, 170.0], [23.0, 170.0], [23.1, 170.0], [23.2, 170.0], [23.3, 170.0], [23.4, 170.0], [23.5, 170.0], [23.6, 170.0], [23.7, 170.0], [23.8, 170.0], [23.9, 170.0], [24.0, 171.0], [24.1, 171.0], [24.2, 171.0], [24.3, 171.0], [24.4, 171.0], [24.5, 171.0], [24.6, 171.0], [24.7, 171.0], [24.8, 171.0], [24.9, 171.0], [25.0, 171.0], [25.1, 171.0], [25.2, 171.0], [25.3, 171.0], [25.4, 171.0], [25.5, 171.0], [25.6, 171.0], [25.7, 171.0], [25.8, 171.0], [25.9, 171.0], [26.0, 171.0], [26.1, 171.0], [26.2, 171.0], [26.3, 171.0], [26.4, 172.0], [26.5, 172.0], [26.6, 172.0], [26.7, 172.0], [26.8, 172.0], [26.9, 172.0], [27.0, 172.0], [27.1, 172.0], [27.2, 172.0], [27.3, 172.0], [27.4, 172.0], [27.5, 172.0], [27.6, 172.0], [27.7, 172.0], [27.8, 172.0], [27.9, 172.0], [28.0, 172.0], [28.1, 172.0], [28.2, 172.0], [28.3, 172.0], [28.4, 172.0], [28.5, 172.0], [28.6, 172.0], [28.7, 172.0], [28.8, 172.0], [28.9, 173.0], [29.0, 173.0], [29.1, 173.0], [29.2, 173.0], [29.3, 173.0], [29.4, 173.0], [29.5, 173.0], [29.6, 173.0], [29.7, 173.0], [29.8, 173.0], [29.9, 173.0], [30.0, 173.0], [30.1, 173.0], [30.2, 173.0], [30.3, 173.0], [30.4, 173.0], [30.5, 174.0], [30.6, 174.0], [30.7, 174.0], [30.8, 174.0], [30.9, 174.0], [31.0, 174.0], [31.1, 174.0], [31.2, 174.0], [31.3, 174.0], [31.4, 174.0], [31.5, 174.0], [31.6, 174.0], [31.7, 175.0], [31.8, 175.0], [31.9, 175.0], [32.0, 175.0], [32.1, 175.0], [32.2, 175.0], [32.3, 175.0], [32.4, 175.0], [32.5, 175.0], [32.6, 175.0], [32.7, 175.0], [32.8, 175.0], [32.9, 175.0], [33.0, 175.0], [33.1, 175.0], [33.2, 176.0], [33.3, 176.0], [33.4, 176.0], [33.5, 176.0], [33.6, 176.0], [33.7, 176.0], [33.8, 176.0], [33.9, 176.0], [34.0, 176.0], [34.1, 176.0], [34.2, 176.0], [34.3, 176.0], [34.4, 176.0], [34.5, 176.0], [34.6, 176.0], [34.7, 176.0], [34.8, 176.0], [34.9, 176.0], [35.0, 176.0], [35.1, 176.0], [35.2, 177.0], [35.3, 177.0], [35.4, 177.0], [35.5, 177.0], [35.6, 177.0], [35.7, 177.0], [35.8, 177.0], [35.9, 177.0], [36.0, 177.0], [36.1, 177.0], [36.2, 177.0], [36.3, 177.0], [36.4, 177.0], [36.5, 178.0], [36.6, 178.0], [36.7, 178.0], [36.8, 178.0], [36.9, 178.0], [37.0, 178.0], [37.1, 178.0], [37.2, 179.0], [37.3, 179.0], [37.4, 179.0], [37.5, 179.0], [37.6, 179.0], [37.7, 179.0], [37.8, 179.0], [37.9, 179.0], [38.0, 179.0], [38.1, 179.0], [38.2, 179.0], [38.3, 179.0], [38.4, 179.0], [38.5, 179.0], [38.6, 180.0], [38.7, 180.0], [38.8, 180.0], [38.9, 180.0], [39.0, 180.0], [39.1, 180.0], [39.2, 180.0], [39.3, 180.0], [39.4, 181.0], [39.5, 181.0], [39.6, 181.0], [39.7, 181.0], [39.8, 181.0], [39.9, 181.0], [40.0, 181.0], [40.1, 181.0], [40.2, 181.0], [40.3, 182.0], [40.4, 182.0], [40.5, 182.0], [40.6, 182.0], [40.7, 182.0], [40.8, 182.0], [40.9, 182.0], [41.0, 182.0], [41.1, 183.0], [41.2, 183.0], [41.3, 183.0], [41.4, 183.0], [41.5, 183.0], [41.6, 183.0], [41.7, 183.0], [41.8, 183.0], [41.9, 183.0], [42.0, 183.0], [42.1, 183.0], [42.2, 183.0], [42.3, 183.0], [42.4, 183.0], [42.5, 183.0], [42.6, 184.0], [42.7, 184.0], [42.8, 184.0], [42.9, 185.0], [43.0, 185.0], [43.1, 185.0], [43.2, 185.0], [43.3, 185.0], [43.4, 185.0], [43.5, 186.0], [43.6, 186.0], [43.7, 186.0], [43.8, 186.0], [43.9, 186.0], [44.0, 186.0], [44.1, 186.0], [44.2, 187.0], [44.3, 187.0], [44.4, 187.0], [44.5, 187.0], [44.6, 187.0], [44.7, 187.0], [44.8, 187.0], [44.9, 188.0], [45.0, 188.0], [45.1, 188.0], [45.2, 188.0], [45.3, 188.0], [45.4, 188.0], [45.5, 188.0], [45.6, 188.0], [45.7, 188.0], [45.8, 189.0], [45.9, 189.0], [46.0, 189.0], [46.1, 189.0], [46.2, 189.0], [46.3, 189.0], [46.4, 189.0], [46.5, 189.0], [46.6, 189.0], [46.7, 189.0], [46.8, 190.0], [46.9, 190.0], [47.0, 190.0], [47.1, 190.0], [47.2, 190.0], [47.3, 191.0], [47.4, 191.0], [47.5, 191.0], [47.6, 191.0], [47.7, 191.0], [47.8, 191.0], [47.9, 191.0], [48.0, 191.0], [48.1, 191.0], [48.2, 191.0], [48.3, 191.0], [48.4, 192.0], [48.5, 192.0], [48.6, 192.0], [48.7, 192.0], [48.8, 192.0], [48.9, 192.0], [49.0, 192.0], [49.1, 192.0], [49.2, 193.0], [49.3, 193.0], [49.4, 193.0], [49.5, 193.0], [49.6, 193.0], [49.7, 193.0], [49.8, 193.0], [49.9, 193.0], [50.0, 194.0], [50.1, 194.0], [50.2, 194.0], [50.3, 194.0], [50.4, 194.0], [50.5, 194.0], [50.6, 194.0], [50.7, 194.0], [50.8, 194.0], [50.9, 194.0], [51.0, 194.0], [51.1, 195.0], [51.2, 195.0], [51.3, 195.0], [51.4, 195.0], [51.5, 195.0], [51.6, 195.0], [51.7, 195.0], [51.8, 195.0], [51.9, 196.0], [52.0, 196.0], [52.1, 196.0], [52.2, 196.0], [52.3, 196.0], [52.4, 196.0], [52.5, 197.0], [52.6, 197.0], [52.7, 197.0], [52.8, 197.0], [52.9, 197.0], [53.0, 197.0], [53.1, 198.0], [53.2, 198.0], [53.3, 198.0], [53.4, 198.0], [53.5, 198.0], [53.6, 198.0], [53.7, 198.0], [53.8, 199.0], [53.9, 199.0], [54.0, 199.0], [54.1, 199.0], [54.2, 199.0], [54.3, 199.0], [54.4, 199.0], [54.5, 199.0], [54.6, 199.0], [54.7, 199.0], [54.8, 199.0], [54.9, 200.0], [55.0, 200.0], [55.1, 200.0], [55.2, 200.0], [55.3, 200.0], [55.4, 200.0], [55.5, 200.0], [55.6, 201.0], [55.7, 201.0], [55.8, 201.0], [55.9, 201.0], [56.0, 202.0], [56.1, 202.0], [56.2, 202.0], [56.3, 202.0], [56.4, 202.0], [56.5, 202.0], [56.6, 202.0], [56.7, 202.0], [56.8, 202.0], [56.9, 202.0], [57.0, 202.0], [57.1, 202.0], [57.2, 202.0], [57.3, 202.0], [57.4, 202.0], [57.5, 202.0], [57.6, 202.0], [57.7, 203.0], [57.8, 203.0], [57.9, 203.0], [58.0, 203.0], [58.1, 203.0], [58.2, 203.0], [58.3, 203.0], [58.4, 203.0], [58.5, 204.0], [58.6, 204.0], [58.7, 204.0], [58.8, 204.0], [58.9, 204.0], [59.0, 204.0], [59.1, 205.0], [59.2, 205.0], [59.3, 205.0], [59.4, 205.0], [59.5, 205.0], [59.6, 205.0], [59.7, 205.0], [59.8, 205.0], [59.9, 205.0], [60.0, 206.0], [60.1, 206.0], [60.2, 206.0], [60.3, 206.0], [60.4, 206.0], [60.5, 206.0], [60.6, 206.0], [60.7, 206.0], [60.8, 206.0], [60.9, 206.0], [61.0, 206.0], [61.1, 206.0], [61.2, 206.0], [61.3, 207.0], [61.4, 207.0], [61.5, 208.0], [61.6, 208.0], [61.7, 208.0], [61.8, 208.0], [61.9, 208.0], [62.0, 208.0], [62.1, 208.0], [62.2, 208.0], [62.3, 208.0], [62.4, 208.0], [62.5, 208.0], [62.6, 209.0], [62.7, 209.0], [62.8, 209.0], [62.9, 209.0], [63.0, 209.0], [63.1, 209.0], [63.2, 209.0], [63.3, 209.0], [63.4, 209.0], [63.5, 209.0], [63.6, 210.0], [63.7, 210.0], [63.8, 210.0], [63.9, 210.0], [64.0, 210.0], [64.1, 210.0], [64.2, 211.0], [64.3, 211.0], [64.4, 211.0], [64.5, 211.0], [64.6, 212.0], [64.7, 212.0], [64.8, 212.0], [64.9, 212.0], [65.0, 212.0], [65.1, 212.0], [65.2, 212.0], [65.3, 212.0], [65.4, 212.0], [65.5, 213.0], [65.6, 213.0], [65.7, 213.0], [65.8, 213.0], [65.9, 214.0], [66.0, 214.0], [66.1, 214.0], [66.2, 214.0], [66.3, 214.0], [66.4, 214.0], [66.5, 214.0], [66.6, 214.0], [66.7, 214.0], [66.8, 214.0], [66.9, 215.0], [67.0, 215.0], [67.1, 215.0], [67.2, 215.0], [67.3, 215.0], [67.4, 215.0], [67.5, 216.0], [67.6, 216.0], [67.7, 216.0], [67.8, 216.0], [67.9, 216.0], [68.0, 216.0], [68.1, 217.0], [68.2, 217.0], [68.3, 217.0], [68.4, 217.0], [68.5, 218.0], [68.6, 218.0], [68.7, 218.0], [68.8, 218.0], [68.9, 218.0], [69.0, 219.0], [69.1, 219.0], [69.2, 219.0], [69.3, 219.0], [69.4, 220.0], [69.5, 220.0], [69.6, 220.0], [69.7, 220.0], [69.8, 220.0], [69.9, 221.0], [70.0, 221.0], [70.1, 221.0], [70.2, 221.0], [70.3, 222.0], [70.4, 222.0], [70.5, 222.0], [70.6, 222.0], [70.7, 222.0], [70.8, 222.0], [70.9, 222.0], [71.0, 222.0], [71.1, 222.0], [71.2, 223.0], [71.3, 223.0], [71.4, 223.0], [71.5, 223.0], [71.6, 223.0], [71.7, 224.0], [71.8, 224.0], [71.9, 224.0], [72.0, 224.0], [72.1, 224.0], [72.2, 224.0], [72.3, 224.0], [72.4, 224.0], [72.5, 224.0], [72.6, 225.0], [72.7, 225.0], [72.8, 225.0], [72.9, 226.0], [73.0, 226.0], [73.1, 226.0], [73.2, 226.0], [73.3, 227.0], [73.4, 227.0], [73.5, 227.0], [73.6, 228.0], [73.7, 228.0], [73.8, 228.0], [73.9, 228.0], [74.0, 228.0], [74.1, 228.0], [74.2, 228.0], [74.3, 228.0], [74.4, 229.0], [74.5, 229.0], [74.6, 229.0], [74.7, 229.0], [74.8, 230.0], [74.9, 230.0], [75.0, 230.0], [75.1, 231.0], [75.2, 231.0], [75.3, 231.0], [75.4, 231.0], [75.5, 231.0], [75.6, 231.0], [75.7, 232.0], [75.8, 232.0], [75.9, 232.0], [76.0, 232.0], [76.1, 232.0], [76.2, 233.0], [76.3, 233.0], [76.4, 233.0], [76.5, 233.0], [76.6, 234.0], [76.7, 234.0], [76.8, 234.0], [76.9, 234.0], [77.0, 234.0], [77.1, 234.0], [77.2, 234.0], [77.3, 234.0], [77.4, 235.0], [77.5, 235.0], [77.6, 235.0], [77.7, 235.0], [77.8, 235.0], [77.9, 235.0], [78.0, 236.0], [78.1, 236.0], [78.2, 236.0], [78.3, 236.0], [78.4, 236.0], [78.5, 237.0], [78.6, 237.0], [78.7, 237.0], [78.8, 237.0], [78.9, 237.0], [79.0, 237.0], [79.1, 237.0], [79.2, 237.0], [79.3, 237.0], [79.4, 237.0], [79.5, 238.0], [79.6, 238.0], [79.7, 238.0], [79.8, 238.0], [79.9, 238.0], [80.0, 239.0], [80.1, 239.0], [80.2, 239.0], [80.3, 239.0], [80.4, 239.0], [80.5, 240.0], [80.6, 240.0], [80.7, 240.0], [80.8, 240.0], [80.9, 241.0], [81.0, 241.0], [81.1, 241.0], [81.2, 241.0], [81.3, 242.0], [81.4, 242.0], [81.5, 242.0], [81.6, 242.0], [81.7, 243.0], [81.8, 243.0], [81.9, 243.0], [82.0, 243.0], [82.1, 243.0], [82.2, 243.0], [82.3, 244.0], [82.4, 244.0], [82.5, 244.0], [82.6, 245.0], [82.7, 245.0], [82.8, 245.0], [82.9, 245.0], [83.0, 246.0], [83.1, 246.0], [83.2, 246.0], [83.3, 247.0], [83.4, 247.0], [83.5, 247.0], [83.6, 248.0], [83.7, 249.0], [83.8, 249.0], [83.9, 249.0], [84.0, 249.0], [84.1, 249.0], [84.2, 249.0], [84.3, 251.0], [84.4, 251.0], [84.5, 251.0], [84.6, 252.0], [84.7, 252.0], [84.8, 253.0], [84.9, 253.0], [85.0, 254.0], [85.1, 254.0], [85.2, 254.0], [85.3, 255.0], [85.4, 255.0], [85.5, 255.0], [85.6, 255.0], [85.7, 256.0], [85.8, 256.0], [85.9, 256.0], [86.0, 256.0], [86.1, 256.0], [86.2, 257.0], [86.3, 257.0], [86.4, 257.0], [86.5, 258.0], [86.6, 258.0], [86.7, 258.0], [86.8, 259.0], [86.9, 259.0], [87.0, 260.0], [87.1, 260.0], [87.2, 260.0], [87.3, 261.0], [87.4, 261.0], [87.5, 262.0], [87.6, 263.0], [87.7, 263.0], [87.8, 263.0], [87.9, 263.0], [88.0, 263.0], [88.1, 264.0], [88.2, 265.0], [88.3, 265.0], [88.4, 266.0], [88.5, 266.0], [88.6, 267.0], [88.7, 268.0], [88.8, 268.0], [88.9, 269.0], [89.0, 269.0], [89.1, 269.0], [89.2, 270.0], [89.3, 270.0], [89.4, 271.0], [89.5, 271.0], [89.6, 271.0], [89.7, 273.0], [89.8, 273.0], [89.9, 273.0], [90.0, 274.0], [90.1, 275.0], [90.2, 276.0], [90.3, 276.0], [90.4, 277.0], [90.5, 280.0], [90.6, 282.0], [90.7, 283.0], [90.8, 283.0], [90.9, 284.0], [91.0, 285.0], [91.1, 285.0], [91.2, 286.0], [91.3, 286.0], [91.4, 287.0], [91.5, 287.0], [91.6, 289.0], [91.7, 289.0], [91.8, 291.0], [91.9, 291.0], [92.0, 291.0], [92.1, 292.0], [92.2, 293.0], [92.3, 294.0], [92.4, 295.0], [92.5, 295.0], [92.6, 295.0], [92.7, 295.0], [92.8, 296.0], [92.9, 296.0], [93.0, 297.0], [93.1, 298.0], [93.2, 298.0], [93.3, 298.0], [93.4, 299.0], [93.5, 299.0], [93.6, 300.0], [93.7, 301.0], [93.8, 301.0], [93.9, 301.0], [94.0, 303.0], [94.1, 304.0], [94.2, 304.0], [94.3, 305.0], [94.4, 308.0], [94.5, 310.0], [94.6, 311.0], [94.7, 312.0], [94.8, 314.0], [94.9, 314.0], [95.0, 318.0], [95.1, 319.0], [95.2, 328.0], [95.3, 329.0], [95.4, 330.0], [95.5, 332.0], [95.6, 334.0], [95.7, 334.0], [95.8, 335.0], [95.9, 338.0], [96.0, 340.0], [96.1, 341.0], [96.2, 341.0], [96.3, 341.0], [96.4, 341.0], [96.5, 342.0], [96.6, 345.0], [96.7, 349.0], [96.8, 351.0], [96.9, 351.0], [97.0, 351.0], [97.1, 353.0], [97.2, 361.0], [97.3, 361.0], [97.4, 364.0], [97.5, 367.0], [97.6, 368.0], [97.7, 370.0], [97.8, 373.0], [97.9, 374.0], [98.0, 388.0], [98.1, 388.0], [98.2, 398.0], [98.3, 405.0], [98.4, 405.0], [98.5, 408.0], [98.6, 408.0], [98.7, 428.0], [98.8, 441.0], [98.9, 450.0], [99.0, 463.0], [99.1, 469.0], [99.2, 475.0], [99.3, 480.0], [99.4, 495.0], [99.5, 540.0], [99.6, 597.0], [99.7, 800.0], [99.8, 1077.0], [99.9, 1362.0]], "isOverall": false, "label": "PUT /users/login", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 1.0, "minX": 100.0, "maxY": 549.0, "series": [{"data": [[300.0, 47.0], [1300.0, 1.0], [400.0, 12.0], [200.0, 387.0], [100.0, 549.0], [800.0, 1.0], [1000.0, 1.0], [500.0, 2.0]], "isOverall": false, "label": "PUT /users/login", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 1300.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 5.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 995.0, "series": [{"data": [[0.0, 995.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [[1.0, 5.0]], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 1.0, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 3.5294748124330155, "minX": 1.77987618E12, "maxY": 4.776119402985076, "series": [{"data": [[1.77987618E12, 4.776119402985076], [1.77987624E12, 3.5294748124330155]], "isOverall": false, "label": "Grupo de Usuarios - Login", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77987624E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 170.84615384615387, "minX": 1.0, "maxY": 275.65, "series": [{"data": [[4.0, 221.56028368794318], [2.0, 170.84615384615387], [1.0, 199.75], [5.0, 260.3055555555556], [3.0, 192.99777777777783], [6.0, 275.65], [7.0, 233.8]], "isOverall": false, "label": "PUT /users/login", "isController": false}, {"data": [[3.6130000000000018, 211.2339999999998]], "isOverall": false, "label": "PUT /users/login-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 7.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 235.46666666666667, "minX": 1.77987618E12, "maxY": 6266.133333333333, "series": [{"data": [[1.77987618E12, 448.75], [1.77987624E12, 6266.133333333333]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.77987618E12, 235.46666666666667], [1.77987624E12, 3296.0833333333335]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77987624E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 207.69453376205803, "minX": 1.77987618E12, "maxY": 260.5223880597015, "series": [{"data": [[1.77987618E12, 260.5223880597015], [1.77987624E12, 207.69453376205803]], "isOverall": false, "label": "PUT /users/login", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77987624E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 207.3376205787781, "minX": 1.77987618E12, "maxY": 258.62686567164184, "series": [{"data": [[1.77987618E12, 258.62686567164184], [1.77987624E12, 207.3376205787781]], "isOverall": false, "label": "PUT /users/login", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77987624E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 4.429796355841368, "minX": 1.77987618E12, "maxY": 35.104477611940304, "series": [{"data": [[1.77987618E12, 35.104477611940304], [1.77987624E12, 4.429796355841368]], "isOverall": false, "label": "PUT /users/login", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77987624E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 146.0, "minX": 1.77987618E12, "maxY": 1362.0, "series": [{"data": [[1.77987618E12, 1362.0], [1.77987624E12, 800.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.77987618E12, 167.0], [1.77987624E12, 146.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.77987618E12, 341.2], [1.77987624E12, 272.6]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.77987618E12, 1362.0], [1.77987624E12, 436.5799999999996]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.77987618E12, 219.0], [1.77987624E12, 191.0]], "isOverall": false, "label": "Median", "isController": false}, {"data": [[1.77987618E12, 451.1999999999996], [1.77987624E12, 310.29999999999995]], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77987624E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 159.0, "minX": 2.0, "maxY": 1077.0, "series": [{"data": [[2.0, 205.5], [10.0, 321.0], [11.0, 159.0], [3.0, 1077.0], [12.0, 276.5], [13.0, 248.5], [14.0, 220.5], [15.0, 170.5], [16.0, 205.0], [17.0, 171.0], [18.0, 183.0], [19.0, 196.0], [20.0, 195.5], [21.0, 196.0], [25.0, 225.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 25.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 159.0, "minX": 2.0, "maxY": 1052.0, "series": [{"data": [[2.0, 205.5], [10.0, 320.5], [11.0, 159.0], [3.0, 1052.0], [12.0, 275.5], [13.0, 248.5], [14.0, 220.0], [15.0, 170.5], [16.0, 205.0], [17.0, 170.0], [18.0, 182.0], [19.0, 195.5], [20.0, 195.0], [21.0, 196.0], [25.0, 225.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 25.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 1.1833333333333333, "minX": 1.77987618E12, "maxY": 15.483333333333333, "series": [{"data": [[1.77987618E12, 1.1833333333333333], [1.77987624E12, 15.483333333333333]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77987624E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 1.1166666666666667, "minX": 1.77987618E12, "maxY": 15.55, "series": [{"data": [[1.77987618E12, 1.1166666666666667], [1.77987624E12, 15.55]], "isOverall": false, "label": "200", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77987624E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 1.1166666666666667, "minX": 1.77987618E12, "maxY": 15.55, "series": [{"data": [[1.77987618E12, 1.1166666666666667], [1.77987624E12, 15.55]], "isOverall": false, "label": "PUT /users/login-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77987624E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 1.1166666666666667, "minX": 1.77987618E12, "maxY": 15.55, "series": [{"data": [[1.77987618E12, 1.1166666666666667], [1.77987624E12, 15.55]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77987624E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 7200000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

