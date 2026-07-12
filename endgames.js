/* Thư viện tàn cuộc & sát pháp kinh điển — setup: [bên, quân, cột, hàng] */
"use strict";
var ENDGAMES = [
{
  id: "doc-tot-thang-tuong",
  name: "Độc Tốt Thắng Cô Tướng",
  cn: "单兵擒王", result: "Đỏ thắng", level: "Cơ bản",
  desc: "Bài học vỡ lòng của tàn cuộc: một Tốt cao cùng Tướng nhà phối hợp bắt sống cô Tướng. Nếu Tốt đã lụt xuống đáy quá sớm thì chỉ hòa.",
  idea: "Tướng Đỏ đứng giữa dùng luật đối mặt khóa một cột, Tốt từng bước dồn Tướng Đen vào góc rồi phong tỏa nốt những ô cuối cùng.",
  setup: [["r","K",4,9],["r","P",4,5],["b","K",4,0]],
  moves: [
    { m: [4,5,4,4], a: "Tốt tiến! Muốn thắng cô Tướng, Tốt phải còn 'cao' và có Tướng nhà trợ chiến — đó là điều kiện bắt buộc." },
    { m: [4,0,4,1], a: "Đen bám trung lộ cố thủ (Tốt đứng giữa đang chặn hai Tướng đối mặt nhau)." },
    { m: [4,4,4,3], a: "Tốt tiếp tục ép xuống — Tướng Đen không dám lại gần vì Tốt khống chế ô ngay trước mặt." },
    { m: [4,1,3,1], a: "Tướng Đen né sang cột 4 tìm đường sống." },
    { m: [4,3,4,2], a: "Tốt áp sát cung Tướng — đã qua hà nên Tốt khống chế cả hai bên sườn lẫn phía trước." },
    { m: [3,1,3,0], a: "Tướng Đen bị dồn xuống tận đáy — hết đất lùi." },
    { m: [4,2,3,2], a: "Tốt bình 6 — đòn kết liễu! Cột giữa mở ra: Tướng Đỏ khóa cột giữa bằng luật đối mặt, Tốt khóa nốt ô cuối cùng. Đen hết nước đi — thua cờ. Ghi nhớ: Tốt xuống đáy quá sớm sẽ chỉ hòa, vì vậy hãy tiến Tốt thong thả và đưa Tướng nhà nhập cuộc." }
  ]
},
{
  id: "song-tot-thang-tuong",
  name: "Song Tốt Thắng Cô Tướng",
  cn: "双兵胜将", result: "Đỏ thắng", level: "Cơ bản",
  desc: "Hai Tốt qua hà kề vai nhau là cỗ máy chiếu bí gọn gàng: một Tốt khóa, một Tốt chiếu, Tướng nhà trấn cột.",
  idea: "Tốt thứ nhất chiếm trung lộ phối hợp với Tướng nhà khóa hai cột, Tốt thứ hai giáng đòn chiếu quyết định.",
  setup: [["r","K",3,9],["r","P",3,2],["r","P",5,2],["b","K",4,0]],
  moves: [
    { m: [3,2,4,2], a: "Tốt bình vào giữa chiếm điểm then chốt, đồng thời mở cột cho Tướng Đỏ khóa mặt (luật hai Tướng không được nhìn nhau)." },
    { m: [4,0,5,0], a: "Tướng Đen không thể sang cột bên kia — Tướng Đỏ đã trấn — đành né sang cánh này. Nước đi bắt buộc!" },
    { m: [5,2,5,1], a: "Tốt thứ hai tiến sát, chiếu Tướng!" },
    { m: [5,0,4,0], a: "Chỉ còn duy nhất đường quay về giữa." },
    { m: [4,2,4,1], a: "Tốt giữa tiến xuống chiếu — chiếu bí! Tướng không bắt được Tốt (Tốt kia bảo vệ chéo sườn), không chạy sang hai bên (một bên Tốt khóa, một bên Tướng Đỏ khóa mặt). Song Tốt kề vai — đòn phối hợp đẹp nhất của quân Tốt." }
  ]
},
{
  id: "song-xe-thac",
  name: "Song Xe Thác (Hai Xe So Le)",
  cn: "双车错", result: "Đỏ thắng", level: "Cơ bản",
  desc: "Sát pháp trứ danh của cặp Xe: hai Xe thay nhau chiếu từng tầng như bậc thang, Tướng địch bị đẩy lên cao rồi hết đường.",
  idea: "Xe thứ nhất khóa hàng đáy, Xe thứ hai khóa tầng giữa, rồi Xe thứ nhất bồi nhát cuối ở tầng ba — ba tầng cung đều bị phong tỏa.",
  setup: [["r","K",3,9],["r","R",8,1],["r","R",7,3],["b","K",4,0],["b","A",3,0]],
  moves: [
    { m: [8,1,8,0], a: "Xe thứ nhất xuống đáy chiếu — Tướng Đen chỉ còn một đường tiến lên (góc kia bị chính Sĩ nhà chặn mất)." },
    { m: [4,0,4,1], a: "Nước bắt buộc: hàng đáy đã bị Xe khóa chặt." },
    { m: [7,3,7,1], a: "Xe thứ hai chiếu tầng hai! Hai Xe bắt đầu 'so le' — thay phiên nhau đuổi Tướng." },
    { m: [4,1,4,2], a: "Tướng bị đẩy lên tầng ba — tầng một, tầng hai đều nằm trong họng Xe." },
    { m: [8,0,8,2], a: "Xe thứ nhất bồi nhát chiếu tầng ba — chiếu bí! Ba tầng cung đều bị khóa, Tướng hết đường. 'Song Xe Thác' là sát pháp phải thuộc lòng: gặp hai Xe thông đường, cung Tướng trống trải là chết ngay." }
  ]
},
{
  id: "ma-hau-phao",
  name: "Mã Hậu Pháo",
  cn: "马后炮", result: "Đỏ thắng", level: "Trung cấp",
  desc: "Đòn sát nổi tiếng nhất của cặp Mã–Pháo, nổi tiếng đến mức thành... thành ngữ: Mã đứng trước làm ngòi, Pháo sau lưng chiếu xuyên, Mã đồng thời khóa luôn hai lối thoát.",
  idea: "Pháo trấn trung lộ giương họng súng chờ sẵn, Mã nhảy hai bước vào tim cung — vừa làm ngòi cho Pháo vừa bịt hai góc đáy.",
  setup: [["r","K",3,9],["r","C",1,8],["r","H",7,5],["b","K",4,0],["b","P",0,3],["b","P",8,3]],
  moves: [
    { m: [1,8,4,8], a: "Pháo bình vào trung lộ — họng pháo giương thẳng vào Tướng, chỉ còn thiếu ngòi." },
    { m: [0,3,0,4], a: "Đen chỉ biết đứng nhìn — Tướng có chạy hướng nào rồi cũng bị dồn về thế này." },
    { m: [7,5,6,3], a: "Mã băng lên — còn một bước nữa là hoàn thành thế trận." },
    { m: [8,3,8,4], a: "Đen vẫn không có cách nào ngăn cản." },
    { m: [6,3,4,2], a: "Mã nhảy vào tim cung — chiếu bí! Mã làm ngòi cho Pháo sau lưng chiếu thẳng, đồng thời khóa cả hai góc đáy cung. Tướng tiến lên cũng vẫn nằm trong họng Pháo. 'Mã hậu Pháo' — đã vào thế là hết thuốc chữa." }
  ]
},
{
  id: "ngoa-tao-ma",
  name: "Ngọa Tào Mã",
  cn: "卧槽马", result: "Đỏ thắng", level: "Trung cấp",
  desc: "'Mã nằm máng' — con Mã phục ở điểm hiểm sát góc cung địch, khóa chặt hai ô then chốt để Xe vào kết liễu.",
  idea: "Mã chiếm điểm ngọa tào khống chế góc cung và đường lên của Tướng, Tốt sâu khóa cánh còn lại, Xe đâm thẳng trung lộ.",
  setup: [["r","K",3,9],["r","R",8,2],["r","H",3,4],["r","P",5,1],["b","K",4,0],["b","P",0,3],["b","P",8,3]],
  moves: [
    { m: [3,4,2,2], a: "Mã phục xuống điểm 'ngọa tào' trứ danh — từ đây Mã khóa cả góc đáy lẫn ô chéo trước cung Tướng." },
    { m: [0,3,0,4], a: "Tướng Đen đã bị Mã và Tốt sâu khóa sạch chỗ trú — chỉ còn nước chờ." },
    { m: [8,2,4,2], a: "Xe bình vào trung lộ chiếu — chiếu bí! Mã ngọa tào giữ chân trái, Tốt sâu giữ chân phải, Xe đâm thẳng mặt. Hãy nhớ vị trí ngọa tào: Mã đứng đó thì Xe chiếu trung lộ gần như luôn là án tử." }
  ]
},
{
  id: "ma-quai-giac",
  name: "Mã Quải Giác (Mã Góc Sĩ)",
  cn: "挂角马", result: "Đỏ thắng", level: "Trung cấp",
  desc: "Mã treo ở góc Sĩ chiếu Tướng — lợi hại nhất khi cung địch còn nguyên đôi Sĩ, vì chính đôi Sĩ chặn hết đường ngang của Tướng nhà.",
  idea: "Mã nhảy vào góc Sĩ vừa chiếu vừa khóa đường lui, Tốt khóa đường lên, Xe quét ngang tầng hai kết liễu.",
  setup: [["r","K",3,9],["r","R",1,3],["r","H",6,4],["r","P",4,3],["b","K",4,0],["b","A",3,0],["b","A",5,0]],
  moves: [
    { m: [6,4,5,2], a: "Mã nhảy vào góc Sĩ — 'Mã quải giác' chiếu Tướng! Đôi Sĩ Đen tự chặn hết hai bên, Tướng chỉ còn một lối." },
    { m: [4,0,4,1], a: "Đường duy nhất: tiến lên tầng hai." },
    { m: [1,3,1,1], a: "Xe chiếu ngang tầng hai — chiếu bí! Mã khóa đường về đáy, Tốt cao khóa đường lên tầng ba, Xe quét sạch tầng hai. Bài học: cung còn đủ Sĩ không phải lúc nào cũng an toàn — với Mã quải giác, đôi Sĩ lại thành vật cản của chính Tướng nhà." }
  ]
},
{
  id: "thiet-mon-thuyen",
  name: "Thiết Môn Thuyên (Chốt Cửa Sắt)",
  cn: "铁门栓", result: "Đỏ thắng", level: "Nâng cao",
  desc: "Pháo trấn trung lộ ghim chết Sĩ giữa như cài một chốt cửa sắt, rồi Xe lẻn xuống hàng đáy kết liễu.",
  idea: "Pháo + Tốt cao tạo thế ghim: Sĩ giữa của Đen không dám rời chỗ (rời là Tướng bị chiếu xuyên). Toàn bộ cung tê liệt, Xe thong thả xuống đáy.",
  setup: [["r","K",4,9],["r","R",0,6],["r","C",4,6],["r","P",4,2],["r","P",3,2],["b","K",4,0],["b","A",4,1],["b","A",5,0],["b","P",0,3]],
  moves: [
    { m: [0,6,0,3], a: "Xe ăn Tốt, dọn sạch đường xuống đáy. Hãy nhìn cột giữa: Pháo và Tốt cao đã 'cài chốt' — Sĩ giữa của Đen bị ghim chết tại chỗ, hễ rời đi là Tướng bị Pháo chiếu xuyên ngay." },
    { m: [4,0,3,0], a: "cả cung tê liệt: Sĩ bị ghim, Sĩ kia hết ô, Tướng chỉ còn đúng một ô để nhích." },
    { m: [0,3,0,0], a: "Xe xuống đáy chiếu — chiếu bí! Tướng không quay về giữa được (Xe khóa cả hàng đáy), không tiến lên được (Tốt khóa), Sĩ vẫn bị Pháo ghim cứng. 'Thiết Môn Thuyên' — một trong những đòn phối hợp Xe-Pháo đáng sợ nhất: cả cung địch đứng yên nhìn Xe vào kết liễu." }
  ]
},
{
  id: "si-tuong-hoa-xe",
  name: "Sĩ Tượng Toàn Thủ Hòa Đơn Xe",
  cn: "士象全和单车", result: "Hòa", level: "Nâng cao",
  desc: "Định thức hòa quan trọng nhất của tàn cuộc: bộ Sĩ Tượng đầy đủ, bố trí đúng cách, sẽ đứng vững trước một Xe đơn độc.",
  idea: "Tượng lấp trung lộ và luôn được Tượng kia bảo vệ (Tượng liên hoàn), Sĩ dựa vào Tướng. Khối phòng ngự liền lạc thì Xe không có điểm đột phá.",
  setup: [["r","K",3,9],["r","R",7,7],["b","K",4,0],["b","A",3,0],["b","A",5,0],["b","E",2,0],["b","E",6,4],["b","P",0,3],["b","P",8,3]],
  moves: [
    { m: [7,7,4,7], a: "Xe chiếm trung lộ chiếu — bài kiểm tra đầu tiên cho hàng phòng ngự Đen." },
    { m: [6,4,4,2], a: "Tượng về lấp trung lộ — nước thủ mẫu mực: vừa cản chiếu, vừa được Tượng kia bảo vệ từ xa (thế 'Tượng liên hoàn')." },
    { m: [4,7,4,4], a: "Xe áp sát đe dọa bắt Tượng giữa." },
    { m: [3,0,4,1], a: "Sĩ lên nâng đỡ — giờ đây bộ Sĩ Tượng kết thành một khối: quân nào cũng có quân khác che chở, Xe nhìn mà không dám đổi." },
    { m: [4,4,1,4], a: "Trung lộ bất khả xâm phạm, Xe đành chuyển cánh tìm sơ hở." },
    { m: [8,3,8,4], a: "Đen ung dung đẩy Tốt chờ — thế trận đã liền lạc thì tuyệt đối không tự động đậy." },
    { m: [1,4,1,1], a: "Xe luồn xuống tầng hai dòm Sĩ — nhưng Sĩ được cả Tướng lẫn Sĩ kia bảo vệ, đổi Xe lấy Sĩ thì Đỏ hết vốn tấn công." },
    { m: [0,3,0,4], a: "Đen giữ nguyên khối phòng ngự — cờ hòa. Kết luận: 'Sĩ Tượng toàn' bố trí đúng sẽ thủ hòa đơn Xe. Nguyên tắc vàng: Tượng lấp trung lộ phải có Tượng kia đỡ, Sĩ dựa Tướng, và tuyệt đối không tự phá vỡ liên kết." }
  ]
}
];
if (typeof module !== "undefined") { module.exports = ENDGAMES; }
