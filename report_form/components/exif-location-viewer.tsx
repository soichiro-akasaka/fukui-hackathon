'use client'

import { useState, useEffect, useRef } from 'react'
import EXIF from 'exif-js'
import { Upload, MapPin } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from '@googlemaps/js-api-loader'
import { useRouter } from 'next/navigation'

// 環境変数からAPIキーを取得
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Loaderのインスタンスを一度だけ作成
const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['marker'],
})

export function ExifLocationViewer() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState<string>("")
  const [title, setTitle] = useState<string>("")
  const [comment, setComment] = useState<string>("")
  const [fixedName, setFixedName] = useState<string>("")
  const [fixedTitle, setFixedTitle] = useState<string>("")
  const [fixedComment, setFixedComment] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markerInstance = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const infoWindowInstance = useRef<google.maps.InfoWindow | null>(null) // InfoWindowのインスタンスを管理
  const router = useRouter()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFile(file)

    // プレビュー用のURLを生成
    const fileURL = URL.createObjectURL(file)
    setPreview(fileURL)

    const reader = new FileReader();
    reader.onload = function(event) {
      const binaryStr = event.target?.result;
      if (binaryStr) {
        const exifData = EXIF.readFromBinaryFile(binaryStr as ArrayBuffer);
        const lat = exifData.GPSLatitude;
        const latRef = exifData.GPSLatitudeRef;
        const lng = exifData.GPSLongitude;
        const lngRef = exifData.GPSLongitudeRef;

        if (lat && latRef && lng && lngRef) {
          const latitude = convertDMSToDD(lat, latRef);
          const longitude = convertDMSToDD(lng, lngRef);
          setLocation({ lat: latitude, lng: longitude });
          setError(null);
        } else {
          setError("位置情報が見つかりませんでした。");
          setLocation(null);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const convertDMSToDD = (dms: number[], ref: string) => {
    let dd = dms[0] + dms[1] / 60 + dms[2] / 3600
    if (ref === "S" || ref === "W") {
      dd = dd * -1
    }
    return Number(dd.toFixed(6))
  }


  const handleSubmit = async () => {
    if (!file || !location) {
      setError("全てのフィールドを入力し、写真をアップロードしてください。")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name)
    formData.append("title", title)
    formData.append("comment", comment)
    formData.append("latitude", location.lat.toString())
    formData.append("longitude", location.lng.toString())
    formData.append("file", file) // ファイルをフォームデータに追加

    try {
      console.log(file)
      const response = await fetch('/api/uploadFileToKintone', {
        method: 'POST',
        body: formData,
      });
      // fileKeyを取得
      const data = await response.json();
      console.log("画像のアップロードに成功", data.fileKey)
      formData.append("fileKey", data.fileKey)

      const createRecordResponse = await fetch('/api/createRecord', {
        method: 'POST',
        body: formData,
      });
  
      if (!createRecordResponse.ok) {
        throw new Error("レコードの作成に失敗：" + createRecordResponse.statusText);
      }
  
      const recordData = await createRecordResponse.json();

      console.log("レコードの作成に成功", recordData)
      router.push('/completion')

    } catch (error) {
      setError((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    loader.importLibrary('maps').then(() => {
        const mapElement = document.getElementById("mapPreview");
        if (mapElement) {
            mapInstance.current = new google.maps.Map(mapElement, {
                center: { lat: 0, lng: 0 },
                zoom: 2,
                mapId: 'DEMO_MAP_ID', // Map IDを追加
                disableDefaultUI: true
            });
        }
    })
  }, [])

  useEffect(() => {
    if (location && mapInstance.current) {
      const lat = Number(location.lat);
      const lng = Number(location.lng);
  
      // latとlngがNaNでないことを確認
      if (!isNaN(lat) && !isNaN(lng)) {
        const position = { lat, lng };
        
        if (markerInstance.current) {
          markerInstance.current.position = position;
        } else {
          markerInstance.current = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstance.current,
            position: position,
            title: 'Location',
          });
        }
  
        mapInstance.current.setCenter(position);
        mapInstance.current.setZoom(15);
        
        // 既存のInfoWindowを閉じる
        if (infoWindowInstance.current) {
          infoWindowInstance.current.close();
        }

        // 新しいInfoWindowを作成
        infoWindowInstance.current = new google.maps.InfoWindow({
          content: `
            <div style="font-family: Arial, sans-serif; padding: 10px; max-width: 200px;">
              <p style="font-weight: bold; margin-bottom: 5px;">投稿者：${name}</p>
              <h3 style="font-size: 16px; margin: 5px 0;">${title}</h3>
              <p style="font-size: 14px; margin-bottom: 10px;">${comment}</p>
              <img src="${preview}" alt="プレビュー" style="width: 100%; height: auto; border-radius: 5px;" />
            </div>
          `,
        });
        infoWindowInstance.current.open(mapInstance.current, markerInstance.current);
      } else {
        console.error('Invalid latitude or longitude:', lat, lng);
      }
    }
  }, [location, fixedName, fixedTitle, fixedComment, preview]);

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-center">つるが市 まちオセロ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <label className="w-full">
            <span className="block text-sm font-medium text-gray-700">投稿者名</span>
            <input
              type="text"
              placeholder="投稿者名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setFixedName(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="w-full">
            <span className="block text-sm font-medium text-gray-700">タイトル</span>
            <input
              type="text"
              placeholder="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => setFixedTitle(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="w-full">
            <span className="block text-sm font-medium text-gray-700">コメント</span>
            <textarea
              placeholder="コメント"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={(e) => setFixedComment(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <Button variant="outline" className="w-full">
            <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center w-full">
              <Upload className="mr-2 h-4 w-4" />
              写真をアップロード
            </label>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {error && <p className="text-red-500">{error}</p>}
          {location && (
            <>
              <hr className="w-full border-gray-300" />
              <div className="flex items-center">
                <MapPin className="h-6 w-6" />
                <p>投稿のプレビュー</p>
              </div>
            </>
          )}
          {location ? (
            <div className="w-full h-64 mt-4" id="mapPreview" ref={mapRef} style={{ height: '800px' }}></div>
          ) : (
            <div className="w-full h-64 mt-4 hidden" id="mapPreview" ref={mapRef} style={{ height: '800px' }}></div>
          )}
          <Button onClick={handleSubmit} className="w-full h-12 bg-blue-500 text-white hover:bg-blue-600" disabled={isSubmitting}>
            {isSubmitting ? '送信中...' : '送信'}
          </Button>
        </div>
      </CardContent>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 mb-2">created by</p>
        <img src="/image.png" alt="コピーライト" className="w-32 m-auto" />
      </div>
    </Card>
  )
}