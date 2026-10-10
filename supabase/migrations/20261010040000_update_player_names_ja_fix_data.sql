-- 修正データ.xlsx(Sheet1: A列=英語名, B列=修正後の日本語名)に従い、選手の日本語名(players.full_name_ja)を更新する。
-- 対象は英語名が完全一致し、既存データに1人だけ対応することを確認した選手。日本語名以外の列は変更しない。
-- 選手ID と英語名(full_name)の両方が一致する行だけを更新する。
update players p
set full_name_ja = v.full_name_ja
from (values
  ('0c7733e1-f9f2-4f6a-ae12-9f5a0db63c43'::uuid, 'KyShawn George', 'キーション・ジョージ'),
  ('59e7fe68-482e-433a-8b8e-d6c5204add78'::uuid, 'Ajay Mitchell', 'エイジェイ・ミッチェル'),
  ('c10286be-b496-4ed7-a960-5d0b51be43cf'::uuid, 'Max Strus', 'マックス・ストゥルース'),
  ('5e7393ad-b642-4053-86dd-3b15a5cb9093'::uuid, 'Alondes Williams', 'アロンデス・ルイス・ウィリアムズ'),
  ('534c6343-2784-47a5-8df3-e88ee689aa07'::uuid, 'Caleb Love', 'ケイレブ・ラブ'),
  ('b7c1a867-0c3f-492e-83bd-26d7c196722f'::uuid, 'Neemias Queta', 'ニーミアス・ケイタ'),
  ('4883a8a4-9946-481b-ad49-9bc8459be431'::uuid, 'Olivier-Maxence Prosper', 'オリバー・マクセンス・プロスパー'),
  ('cd91d847-1de2-4813-b778-2e9a0119ec83'::uuid, 'Ausar Thompson', 'アサー・トンプソン'),
  ('eb0f79e9-76fa-43e8-8351-828753541aba'::uuid, 'Micah Potter', 'マイカ・ポッター'),
  ('849e1d0a-cc6f-4fe7-a195-831f420e5e5e'::uuid, 'Javon Small', 'ジャボン・スモール'),
  ('b37f4707-2cc1-4c23-bfac-1fee40056c4b'::uuid, 'Zaccharie Risacher', 'ザカリー・リサシェ'),
  ('6a376087-5554-4ac5-af0e-8ef46fd5671f'::uuid, 'Gui Santos', 'ギー・サントス'),
  ('160bb507-8648-49e3-a7cb-c5f02472e427'::uuid, 'John Poulakidas', 'ジョン・プラキダス'),
  ('bdf46c4d-01ca-44d7-bf6e-16c053c634b1'::uuid, 'LJ Cryer', 'L・J・クライヤー'),
  ('ee839d69-74d3-4686-8251-1504e8c5a5d1'::uuid, 'Jake LaRavia', 'ジェイク・ラレイビア'),
  ('bbd54132-4279-4345-9723-b641c48e6edf'::uuid, 'Josh Minott', 'ジョシュ・マイノット'),
  ('cc1a9f83-28e1-429a-9676-cb68ddb4012f'::uuid, 'Jalen Slawson', 'ジェイレン・スローソン'),
  ('df9ce3fb-e64f-4333-8ae1-c726c4871802'::uuid, 'Javonte Green', 'ジャボンテ・グリーン'),
  ('6c138453-fc5e-46e1-98d8-2db9a547c6d8'::uuid, 'Jamal Shead', 'ジャマル・シェッド'),
  ('3afd1be8-c519-496a-80a2-b3901cc3615f'::uuid, 'Trendon Watford', 'トレンドン・ワトフォード'),
  ('ac5114e5-bcb9-4275-9a9e-5c9785444d7f'::uuid, 'Jahmai Mashack', 'ジャフマイ・マシャック'),
  ('1ab6fd89-0a51-4449-8517-a7f3c6a5016b'::uuid, 'Kasparas Jakučionis', 'カスパラス・ヤクチオニス'),
  ('771b9987-786d-4162-b2f6-a1b3c947fb0e'::uuid, 'Nae''Qwan Tomlin', 'ネイクワン・トムリン'),
  ('5b0ce7ad-20e6-4166-b08f-3200de4da078'::uuid, 'Ryan Dunn', 'ライアン・ダン'),
  ('6f012757-71b0-42dd-b50d-c2a1716b1d0f'::uuid, 'Jamaree Bouyea', 'ジャマリー・ブイエ'),
  ('9e77dcac-7504-4f03-8f2d-dcd57431525e'::uuid, 'Tyrese Proctor', 'タイリース・プロクター'),
  ('1123c296-932f-41d3-a9f1-c6d7073f9c86'::uuid, 'Pete Nance', 'ピート・ナンス'),
  ('30f06641-f0c2-4609-82e3-84a321d02a89'::uuid, 'Sion James', 'シオン・ジェームス'),
  ('6f555bdb-4b7e-45dc-bfc0-c24d2c1d3487'::uuid, 'Jamal Cain', 'ジャマール・ケイン'),
  ('036c2190-0d7b-410c-932e-e37090a37268'::uuid, 'Trey Alexander', 'トレイ・アレクサンダー'),
  ('6451815b-776a-406f-9670-bc05688c77af'::uuid, 'Rayan Rupert', 'ライアン・ルパート'),
  ('7b07c47d-6d7c-4c8e-9576-62884030ab2c'::uuid, 'Sidy Cissoko', 'シディ・シソコ'),
  ('78235290-a2d1-4484-8d50-d4f3d4c921c7'::uuid, 'Malaki Branham', 'マラカイ・ブランナム'),
  ('bbc9a5cb-55ef-4abb-8956-3d7e2cc087a7'::uuid, 'PJ Hall', 'P.J.・ホール'),
  ('d76d5df4-4920-4b5b-9cdf-757e38b334ff'::uuid, 'Mouhamed Gueye', 'モハメッド・ゲイ'),
  ('66b8e77c-5072-43bc-8209-8dd84b53fb37'::uuid, 'Jase Richardson', 'ジェイス・リチャードソン'),
  ('e7714144-9fa3-4c74-bb98-985b0ebfadae'::uuid, 'Grant Nelson', 'グラント・ネルソン'),
  ('c8198220-b62e-4eeb-9e70-c7b3532d74ca'::uuid, 'Noah Penda', 'ノア・ペンダ'),
  ('dc1205ce-b03d-4bcb-b9eb-bdce7151290b'::uuid, 'Joan Beringer', 'ジョアン・ベリンジャー'),
  ('2f6461e4-dda3-4123-8d4e-4551865cbf68'::uuid, 'Mohamed Diawara', 'モハメド・ディアワラ'),
  ('81d78dc3-f764-4f2c-883d-edd4de8d2957'::uuid, 'Malevy Leons', 'マレヴィ・レオンズ'),
  ('db085f73-d67a-40e2-a85b-5ffbba4df4fa'::uuid, 'Chris Livingston', 'クリス・リビングストン'),
  ('e036884b-b1b2-44a0-9320-2e0a94a8056c'::uuid, 'Julian Phillips', 'ジュリアン・フィリップス'),
  ('1170e0c9-d3f5-4a88-a029-cffbc2f304de'::uuid, 'Chris Boucher', 'クリス・ブーシェ'),
  ('a581ff9a-d35d-4ba7-85fe-4c0a43509374'::uuid, 'Ariel Hukporti', 'アリエル・ハクポーティ'),
  ('b40fc269-68e2-457e-81c3-269a80fc5884'::uuid, 'Isaiah Crawford', 'アイザイア・クロフォード'),
  ('80d194ce-b22d-44fc-a340-00f910ef4a32'::uuid, 'Adou Thiero', 'アドゥ・シエロ'),
  ('d1e374d9-c01b-4b94-afcf-829cd8008a74'::uuid, 'Jonathan Mogbo', 'ジョナサン・モグボ'),
  ('4565f1f7-dacc-4526-b551-a0740b948d6d'::uuid, 'Max Shulga', 'マックス・シュルガ'),
  ('f32f422a-05bd-4e52-b59d-2e2824c10db6'::uuid, 'Jahmyl Telfort', 'ジャミル・テルフォート'),
  ('2fac8802-3cc0-4a93-8aa2-2638e2881311'::uuid, 'Tosan Evbuomwan', 'トサン・エブブオムワン')
) as v(id, full_name, full_name_ja)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is distinct from v.full_name_ja;

-- Luguentz Dort の正式表記(ユーザー確認済み)。「ー」は長音記号(U+30FC)
update players set full_name_ja = 'ルーゲンツ・ドート'
where id = '818fd7c8-619d-48c0-9b19-a95db8e2be1f' and full_name = 'Luguentz Dort';
